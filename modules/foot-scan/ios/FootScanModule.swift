import ARKit
import AVFoundation
import ExpoModulesCore

/// پل بین جاوااسکریپت و اسکنر پای ARKit.
public class FootScanModule: Module {
  public func definition() -> ModuleDefinition {
    Name("FootScan")

    // نام ثابت‌ها با نام توابع یکی نباشد؛ هر دو روی یک شیء جاوااسکریپت می‌نشینند.
    Constants([
      "scanSupported": FootScanCapability.isSupported,
      "hasLiDAR": FootScanCapability.hasLiDAR,
      "supportsMesh": FootScanCapability.supportsMesh,
      "unsupportedReasonText": FootScanCapability.unsupportedReason ?? "",
      "minimumPoints": FootMeasurer.minimumPoints,
    ])

    Function("isSupported") { () -> Bool in
      FootScanCapability.isSupported
    }

    Function("unsupportedReason") { () -> String? in
      FootScanCapability.unsupportedReason
    }

    AsyncFunction("requestCameraPermission") { (promise: Promise) in
      switch AVCaptureDevice.authorizationStatus(for: .video) {
      case .authorized:
        promise.resolve(true)
      case .notDetermined:
        AVCaptureDevice.requestAccess(for: .video) { granted in
          promise.resolve(granted)
        }
      default:
        promise.resolve(false)
      }
    }

    View(FootScanView.self) {
      Events("onScanStatus", "onScanProgress", "onScanResult", "onScanError")

      Prop("footSide") { (view: FootScanView, side: String) in
        view.footSide = side == "left" ? "left" : "right"
      }

      Prop("regionRadius") { (view: FootScanView, radius: Double) in
        view.regionRadius = Float(max(0.10, min(0.50, radius)))
      }

      Prop("maxHeight") { (view: FootScanView, height: Double) in
        view.maxHeight = Float(max(0.08, min(0.40, height)))
      }

      // فرمان‌های نما از سمت ref در جاوااسکریپت؛ همه روی ترد اصلی اجرا می‌شوند
      // چون ARKit فقط از ترد اصلی قابل فرمان‌دادن است.
      AsyncFunction("start") { (view: FootScanView) in
        DispatchQueue.main.async { view.startScan() }
      }

      AsyncFunction("finish") { (view: FootScanView) in
        DispatchQueue.main.async { view.finishScan() }
      }

      AsyncFunction("reset") { (view: FootScanView) in
        DispatchQueue.main.async { view.resetScan() }
      }
    }
  }
}
