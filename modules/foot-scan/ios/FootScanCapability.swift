import ARKit

/// بررسی این‌که دستگاه سخت‌افزار لازم برای اسکن سه‌بعدی پا را دارد یا نه.
/// مسیر اصلی ما نقشه‌ی عمق LiDAR است؛ روی گوشی‌های بدون LiDAR اسکن در دسترس نیست.
enum FootScanCapability {
  static var isARSupported: Bool {
    ARWorldTrackingConfiguration.isSupported
  }

  static var hasSmoothedDepth: Bool {
    ARWorldTrackingConfiguration.supportsFrameSemantics(.smoothedSceneDepth)
  }

  static var hasSceneDepth: Bool {
    ARWorldTrackingConfiguration.supportsFrameSemantics(.sceneDepth)
  }

  static var hasLiDAR: Bool {
    hasSmoothedDepth || hasSceneDepth
  }

  static var supportsMesh: Bool {
    ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh)
  }

  static var isSupported: Bool {
    isARSupported && hasLiDAR
  }

  /// دلیل خوانا برای وقتی اسکن در دسترس نیست تا در رابط کاربری نشان داده شود.
  static var unsupportedReason: String? {
    if !isARSupported { return "این دستگاه از ARKit پشتیبانی نمی‌کند." }
    if !hasLiDAR { return "این گوشی سنسور LiDAR ندارد؛ اسکن سه‌بعدی روی مدل‌های iPhone Pro و iPad Pro کار می‌کند." }
    return nil
  }
}
