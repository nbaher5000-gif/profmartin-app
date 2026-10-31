import ARKit
import ExpoModulesCore
import Foundation
import SceneKit

/// نمای دوربین ARKit که هنگام اسکن، نقشه‌ی عمق LiDAR را به ابر نقاط پا تبدیل می‌کند.
///
/// جریان کار:
///   ۱ نشست AR با تشخیص صفحه‌ی افقی بالا می‌آید و منتظر پیدا شدن کف می‌ماند.
///   ۲ کاربر گوشی را به پا نشانه می‌گیرد و `start()` را می‌زند؛ از مرکز صفحه یک
///     پرتو به کف می‌فرستیم تا ارتفاع دقیق کف و مرکز ناحیه‌ی اسکن معلوم شود.
///   ۳ در هر چند فریم، پیکسل‌های عمق به مختصات جهانی تبدیل و فیلتر می‌شوند
///     (فقط نقاط بالای کف، زیر قوزک و داخل شعاع ناحیه).
///   ۴ با `finish()` ابر نقاط اندازه‌گیری و در قالب PLY ذخیره می‌شود.
class FootScanView: ExpoView, ARSessionDelegate {
  // MARK: رویدادها (سمت جاوااسکریپت)

  let onScanStatus = EventDispatcher()
  let onScanProgress = EventDispatcher()
  let onScanResult = EventDispatcher()
  let onScanError = EventDispatcher()

  // MARK: ویژگی‌ها

  /// "left" یا "right" — فقط برای برچسب‌گذاری نتیجه و نام فایل.
  var footSide: String = "right"

  /// شعاع ناحیه‌ی اسکن حول نقطه‌ی هدف (متر).
  var regionRadius: Float = 0.26

  /// بیشترین ارتفاع نقاط از کف (متر) — بالاتر از این، ساق پا حساب می‌شود.
  var maxHeight: Float = 0.22

  // MARK: وضعیت داخلی

  private enum Phase: String {
    case idle, waitingForFloor, ready, scanning, finished
  }

  private let sceneView = ARSCNView(frame: .zero)
  private let targetRing = CAShapeLayer()
  private let cloud = PointCloudAccumulator()

  private var phase: Phase = .idle {
    didSet {
      guard phase != oldValue else { return }
      onScanStatus(["phase": phase.rawValue])
    }
  }

  private var floorY: Float?
  private var regionCenter: simd_float3?
  private var frameCounter = 0
  private var lastProgressSent = Date.distantPast

  // MARK: ساخت نما

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    backgroundColor = .black

    sceneView.automaticallyUpdatesLighting = true
    sceneView.session.delegate = self
    addSubview(sceneView)

    targetRing.fillColor = UIColor.clear.cgColor
    targetRing.strokeColor = UIColor(white: 1, alpha: 0.85).cgColor
    targetRing.lineWidth = 2
    targetRing.lineDashPattern = [8, 6]
    layer.addSublayer(targetRing)
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    sceneView.frame = bounds
    let side = min(bounds.width, bounds.height) * 0.62
    let rect = CGRect(x: bounds.midX - side / 2, y: bounds.midY - side / 2, width: side, height: side)
    targetRing.path = UIBezierPath(ovalIn: rect).cgPath
    targetRing.frame = bounds
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window == nil {
      sceneView.session.pause()
      phase = .idle
    } else {
      runSession()
    }
  }

  // MARK: فرمان‌هایی که از جاوااسکریپت صدا زده می‌شوند

  func startScan() {
    guard FootScanCapability.isSupported else {
      onScanError(["message": FootScanCapability.unsupportedReason ?? "اسکن روی این دستگاه پشتیبانی نمی‌شود."])
      return
    }

    // پرتو از مرکز صفحه به کف: هم ارتفاع کف و هم مرکز ناحیه‌ی اسکن را می‌دهد.
    let center = CGPoint(x: bounds.midX, y: bounds.midY)
    if let query = sceneView.raycastQuery(from: center, allowing: .existingPlaneGeometry, alignment: .horizontal),
       let hit = sceneView.session.raycast(query).first {
      let position = hit.worldTransform.columns.3
      floorY = position.y
      regionCenter = simd_float3(position.x, position.y, position.z)
    } else if let knownFloor = floorY {
      // اگر پرتو به صفحه نخورد، از دوربین یک نقطه‌ی جلویی روی کف تخمین می‌زنیم.
      guard let frame = sceneView.session.currentFrame else {
        onScanError(["message": "دوربین آماده نیست. چند لحظه صبر کنید."])
        return
      }
      let cameraTransform = frame.camera.transform
      let forward = simd_float3(-cameraTransform.columns.2.x, 0, -cameraTransform.columns.2.z)
      let origin = simd_float3(cameraTransform.columns.3.x, knownFloor, cameraTransform.columns.3.z)
      regionCenter = origin + simd_normalize(forward) * 0.25
    } else {
      onScanError(["message": "کف اتاق پیدا نشد. گوشی را آرام روی زمین بچرخانید."])
      return
    }

    cloud.reset()
    frameCounter = 0
    phase = .scanning
  }

  func finishScan() {
    guard phase == .scanning else { return }
    phase = .finished

    guard let floorY else {
      onScanError(["message": "ارتفاع کف ثبت نشده بود؛ اسکن را دوباره شروع کنید."])
      return
    }

    let points = cloud.points
    guard let measurement = FootMeasurer.measure(points: points, floorY: floorY) else {
      onScanError([
        "message": "نقاط کافی ثبت نشد. پا را داخل دایره نگه دارید و آرام دور پا بچرخید.",
        "pointCount": points.count,
      ])
      return
    }

    var payload = measurement.dictionary
    payload["footSide"] = footSide
    payload["scannedAt"] = ISO8601DateFormatter().string(from: Date())
    if let path = writePointCloud(points) {
      payload["pointCloudPath"] = path
    }
    onScanResult(payload)
  }

  func resetScan() {
    cloud.reset()
    frameCounter = 0
    phase = floorY == nil ? .waitingForFloor : .ready
  }

  var pointCount: Int { cloud.count }

  // MARK: نشست AR

  private func runSession() {
    guard FootScanCapability.isSupported else {
      onScanError(["message": FootScanCapability.unsupportedReason ?? "اسکن روی این دستگاه پشتیبانی نمی‌شود."])
      return
    }

    let configuration = ARWorldTrackingConfiguration()
    configuration.worldAlignment = .gravity
    configuration.planeDetection = [.horizontal]
    if FootScanCapability.hasSmoothedDepth {
      configuration.frameSemantics.insert(.smoothedSceneDepth)
    } else if FootScanCapability.hasSceneDepth {
      configuration.frameSemantics.insert(.sceneDepth)
    }

    sceneView.session.run(configuration, options: [.resetTracking, .removeExistingAnchors])
    phase = .waitingForFloor
  }

  func session(_ session: ARSession, didAdd anchors: [ARAnchor]) {
    updateFloor(from: anchors)
  }

  func session(_ session: ARSession, didUpdate anchors: [ARAnchor]) {
    updateFloor(from: anchors)
  }

  func session(_ session: ARSession, didFailWithError error: Error) {
    onScanError(["message": error.localizedDescription])
  }

  func session(_ session: ARSession, didUpdate frame: ARFrame) {
    guard phase == .scanning else { return }
    frameCounter += 1
    // هر فریم سوم کافی است؛ گرید ووکسل نقاط تکراری را حذف می‌کند.
    guard frameCounter % 3 == 0 else { return }
    accumulate(frame: frame)
    sendProgress()
  }

  /// پایین‌ترین صفحه‌ی افقی را کف در نظر می‌گیریم.
  private func updateFloor(from anchors: [ARAnchor]) {
    for anchor in anchors {
      guard let plane = anchor as? ARPlaneAnchor, plane.alignment == .horizontal else { continue }
      let y = plane.transform.columns.3.y
      if floorY == nil || y < floorY! {
        floorY = y
      }
    }
    if floorY != nil, phase == .waitingForFloor {
      phase = .ready
    }
  }

  // MARK: تبدیل نقشه‌ی عمق به ابر نقاط

  private func accumulate(frame: ARFrame) {
    guard let floorY, let regionCenter else { return }
    guard let depthData = frame.smoothedSceneDepth ?? frame.sceneDepth else { return }

    let depthMap = depthData.depthMap
    CVPixelBufferLockBaseAddress(depthMap, .readOnly)
    defer { CVPixelBufferUnlockBaseAddress(depthMap, .readOnly) }
    guard let depthBase = CVPixelBufferGetBaseAddress(depthMap) else { return }

    let width = CVPixelBufferGetWidth(depthMap)
    let height = CVPixelBufferGetHeight(depthMap)
    let depthRowBytes = CVPixelBufferGetBytesPerRow(depthMap)

    let confidenceMap = depthData.confidenceMap
    if let confidenceMap { CVPixelBufferLockBaseAddress(confidenceMap, .readOnly) }
    defer {
      if let confidenceMap { CVPixelBufferUnlockBaseAddress(confidenceMap, .readOnly) }
    }
    let confidenceBase = confidenceMap.flatMap { CVPixelBufferGetBaseAddress($0) }
    let confidenceRowBytes = confidenceMap.map { CVPixelBufferGetBytesPerRow($0) } ?? 0

    // ضرایب دوربین برای رزولوشن تصویر هستند و باید به اندازه‌ی نقشه‌ی عمق مقیاس شوند.
    let intrinsics = frame.camera.intrinsics
    let imageResolution = frame.camera.imageResolution
    let scaleX = Float(width) / Float(imageResolution.width)
    let scaleY = Float(height) / Float(imageResolution.height)
    let fx = intrinsics[0][0] * scaleX
    let fy = intrinsics[1][1] * scaleY
    let cx = intrinsics[2][0] * scaleX
    let cy = intrinsics[2][1] * scaleY
    let cameraTransform = frame.camera.transform

    let radiusSquared = regionRadius * regionRadius

    for row in 0..<height {
      let depthRow = depthBase.advanced(by: row * depthRowBytes).assumingMemoryBound(to: Float32.self)
      let confidenceRow = confidenceBase?.advanced(by: row * confidenceRowBytes).assumingMemoryBound(to: UInt8.self)

      for column in 0..<width {
        // فقط نقاط با اطمینان بالا؛ نقاط لبه‌ای LiDAR اندازه را به‌هم می‌ریزند.
        if let confidenceRow, confidenceRow[column] < UInt8(ARConfidenceLevel.high.rawValue) { continue }

        let depth = depthRow[column]
        guard depth.isFinite, depth > 0.10, depth < 1.20 else { continue }

        let x = (Float(column) - cx) * depth / fx
        let y = (Float(row) - cy) * depth / fy
        // محورهای دوربین ARKit: راست +x، بالا +y، جلو -z؛ محور y نقشه‌ی عمق پایین است.
        let local = simd_float4(x, -y, -depth, 1)
        let world = cameraTransform * local

        let heightFromFloor = world.y - floorY
        guard heightFromFloor > 0.005, heightFromFloor < maxHeight else { continue }

        let dx = world.x - regionCenter.x
        let dz = world.z - regionCenter.z
        guard dx * dx + dz * dz < radiusSquared else { continue }

        cloud.add(simd_float3(world.x, world.y, world.z))
      }
    }
  }

  private func sendProgress() {
    guard Date().timeIntervalSince(lastProgressSent) > 0.25 else { return }
    lastProgressSent = Date()
    onScanProgress([
      "pointCount": cloud.count,
      "ready": cloud.count >= FootMeasurer.minimumPoints,
      "full": cloud.isFull,
    ])
  }

  // MARK: ذخیره‌ی ابر نقاط

  /// ابر نقاط را به‌صورت PLY متنی در پوشه‌ی Documents ذخیره می‌کند تا بعداً
  /// بتوان آن را برای فروشگاه فرستاد یا در نرم‌افزار سه‌بعدی باز کرد.
  private func writePointCloud(_ points: [simd_float3]) -> String? {
    guard !points.isEmpty else { return nil }
    let documents = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first
    guard let documents else { return nil }

    let folder = documents.appendingPathComponent("foot-scans", isDirectory: true)
    try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)

    let stamp = Int(Date().timeIntervalSince1970)
    let url = folder.appendingPathComponent("\(footSide)-\(stamp).ply")

    var text = """
    ply
    format ascii 1.0
    element vertex \(points.count)
    property float x
    property float y
    property float z
    end_header

    """
    text.reserveCapacity(points.count * 26)
    for point in points {
      text += "\(point.x) \(point.y) \(point.z)\n"
    }

    do {
      try text.write(to: url, atomically: true, encoding: .utf8)
      return url.absoluteString
    } catch {
      return nil
    }
  }
}
