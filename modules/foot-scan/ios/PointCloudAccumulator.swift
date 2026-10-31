import simd

/// ابر نقاط را در یک گرید ووکسل نگه می‌دارد تا نقاط تکراری فریم‌های پشت‌سرهم
/// روی هم انبار نشوند و حافظه در اسکن چندثانیه‌ای کنترل‌شده بماند.
final class PointCloudAccumulator {
  private let voxelSize: Float
  private let maxVoxels: Int
  private var voxels: [Int64: simd_float3] = [:]

  /// ووکسل ۲ میلی‌متری: ریزتر از دقت واقعی LiDAR هست و جزئیات پا را از دست نمی‌دهد.
  init(voxelSize: Float = 0.002, maxVoxels: Int = 250_000) {
    self.voxelSize = voxelSize
    self.maxVoxels = maxVoxels
    voxels.reserveCapacity(60_000)
  }

  var count: Int { voxels.count }
  var isFull: Bool { voxels.count >= maxVoxels }
  var points: [simd_float3] { Array(voxels.values) }

  @discardableResult
  func add(_ point: simd_float3) -> Bool {
    if voxels.count >= maxVoxels { return false }
    let key = Self.key(for: point, size: voxelSize)
    if voxels[key] != nil { return false }
    voxels[key] = point
    return true
  }

  func reset() {
    voxels.removeAll(keepingCapacity: true)
  }

  /// بسته‌بندی دقیق مختصات ووکسل در یک Int64 (۲۱ بیت برای هر محور) — بدون برخورد هش.
  private static func key(for point: simd_float3, size: Float) -> Int64 {
    let bias: Int64 = 1 << 20
    let x = Int64((point.x / size).rounded()) + bias
    let y = Int64((point.y / size).rounded()) + bias
    let z = Int64((point.z / size).rounded()) + bias
    return (x << 42) | (y << 21) | z
  }
}
