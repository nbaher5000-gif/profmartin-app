import Foundation
import simd

/// نتیجه‌ی اندازه‌گیری پا؛ همه‌ی طول‌ها میلی‌متر هستند.
struct FootMeasurement {
  var lengthMm: Double
  var ballWidthMm: Double
  var maxWidthMm: Double
  var heelWidthMm: Double
  var instepHeightMm: Double
  var ballHeightMm: Double
  var ballGirthMm: Double
  var pointCount: Int
  var coverage: Double
  var confidence: Double

  var dictionary: [String: Any] {
    [
      "lengthMm": round(lengthMm * 10) / 10,
      "ballWidthMm": round(ballWidthMm * 10) / 10,
      "maxWidthMm": round(maxWidthMm * 10) / 10,
      "heelWidthMm": round(heelWidthMm * 10) / 10,
      "instepHeightMm": round(instepHeightMm * 10) / 10,
      "ballHeightMm": round(ballHeightMm * 10) / 10,
      "ballGirthMm": round(ballGirthMm * 10) / 10,
      "pointCount": pointCount,
      "coverage": round(coverage * 100) / 100,
      "confidence": round(confidence * 100) / 100,
    ]
  }
}

/// از ابر نقاط پا (در دستگاه مختصات جهانی ARKit، با محور Y هم‌راستای گرانش)
/// اندازه‌های کاربردی کفش را بیرون می‌کشد.
enum FootMeasurer {
  /// کمترین تعداد نقطه‌ای که اندازه‌گیری را معنادار می‌کند.
  static let minimumPoints = 900

  static func measure(points: [simd_float3], floorY: Float) -> FootMeasurement? {
    guard points.count >= minimumPoints else { return nil }

    // ۱) تبدیل به مختصات صفحه‌ی کف: (x, z) افقی و h ارتفاع از کف
    var planar = points.map { simd_float2($0.x, $0.z) }
    var heights = points.map { Double($0.y - floorY) }

    // ۲) حذف نقاط پرت (مبلمان، پای دیگر) با دو بار کوتاه‌کردن حول مرکز جرم
    for _ in 0..<2 {
      let center = centroid(planar)
      var keptPlanar: [simd_float2] = []
      var keptHeights: [Double] = []
      keptPlanar.reserveCapacity(planar.count)
      keptHeights.reserveCapacity(planar.count)
      for (index, point) in planar.enumerated() where simd_distance(point, center) < 0.22 {
        keptPlanar.append(point)
        keptHeights.append(heights[index])
      }
      guard keptPlanar.count >= minimumPoints else { break }
      planar = keptPlanar
      heights = keptHeights
    }
    guard planar.count >= minimumPoints else { return nil }

    // ۳) محور بلند پا را با تحلیل مؤلفه‌های اصلی (PCA دوبعدی) پیدا می‌کنیم
    let center = centroid(planar)
    let axis = principalAxis(planar, center: center)
    let normal = simd_float2(-axis.y, axis.x)

    // ۴) مختصات محلی: u در راستای طول پا، v در راستای عرض
    var along = [Double](repeating: 0, count: planar.count)
    var across = [Double](repeating: 0, count: planar.count)
    for (index, point) in planar.enumerated() {
      let delta = point - center
      along[index] = Double(simd_dot(delta, axis))
      across[index] = Double(simd_dot(delta, normal))
    }

    // ۵) طول پا با صدک ۰.۵ و ۹۹.۵ تا یک نقطه‌ی نویزی طول را بزرگ نکند
    let sortedAlong = along.sorted()
    let uMin = percentile(sortedAlong, 0.005)
    let uMax = percentile(sortedAlong, 0.995)
    let lengthM = uMax - uMin
    guard lengthM > 0.15, lengthM < 0.40 else { return nil }

    // ۶) نرمال‌سازی به t در بازه‌ی صفر تا یک
    var t = along.map { ($0 - uMin) / lengthM }

    // ۷) تشخیص جهت: سمت پاشنه بلندتر از سمت پنجه است
    let heelEndHeight = meanHeight(heights, t: t, from: 0.00, to: 0.18)
    let toeEndHeight = meanHeight(heights, t: t, from: 0.82, to: 1.00)
    if toeEndHeight > heelEndHeight {
      t = t.map { 1 - $0 }
    }

    // ۸) عرض‌ها: پاشنه، پنجه (عریض‌ترین بخش کف پا) و بیشینه‌ی کل
    let heelWidth = width(across, t: t, from: 0.02, to: 0.18)
    let ballWidth = width(across, t: t, from: 0.58, to: 0.80)
    let maxWidth = maximumBinWidth(across, t: t)

    // ۹) ارتفاع روی پا و ارتفاع مقطع پنجه
    let instepHeight = heightPercentile(heights, t: t, from: 0.35, to: 0.58, p: 0.97)
    let ballHeight = heightPercentile(heights, t: t, from: 0.58, to: 0.80, p: 0.97)

    // ۱۰) دور پنجه: تخمین با محیط نیم‌بیضی روی کف پا (پایه‌ی صاف + کمان بالا)
    let girth = ballGirth(width: ballWidth, height: ballHeight)

    // ۱۱) پوشش اسکن: چند درصد از بازه‌ی طول پا نقطه دارد
    let coverageValue = coverage(t: t)
    let density = min(Double(planar.count) / 9000.0, 1.0)
    let confidence = max(0, min(1, density * 0.45 + coverageValue * 0.55))

    return FootMeasurement(
      lengthMm: lengthM * 1000,
      ballWidthMm: ballWidth * 1000,
      maxWidthMm: maxWidth * 1000,
      heelWidthMm: heelWidth * 1000,
      instepHeightMm: instepHeight * 1000,
      ballHeightMm: ballHeight * 1000,
      ballGirthMm: girth * 1000,
      pointCount: planar.count,
      coverage: coverageValue,
      confidence: confidence
    )
  }

  // MARK: - کمک‌تابع‌ها

  private static func centroid(_ points: [simd_float2]) -> simd_float2 {
    var sum = simd_float2(0, 0)
    for point in points { sum += point }
    return sum / Float(max(points.count, 1))
  }

  /// بردار ویژه‌ی مربوط به بزرگ‌ترین مقدار ویژه‌ی ماتریس کوواریانس ۲×۲
  private static func principalAxis(_ points: [simd_float2], center: simd_float2) -> simd_float2 {
    var sxx: Double = 0, sxy: Double = 0, syy: Double = 0
    for point in points {
      let dx = Double(point.x - center.x)
      let dy = Double(point.y - center.y)
      sxx += dx * dx
      sxy += dx * dy
      syy += dy * dy
    }
    let theta = 0.5 * atan2(2 * sxy, sxx - syy)
    return simd_normalize(simd_float2(Float(cos(theta)), Float(sin(theta))))
  }

  private static func percentile(_ sorted: [Double], _ p: Double) -> Double {
    guard !sorted.isEmpty else { return 0 }
    let index = Int((Double(sorted.count - 1) * p).rounded())
    return sorted[max(0, min(sorted.count - 1, index))]
  }

  private static func slice(_ values: [Double], t: [Double], from: Double, to: Double) -> [Double] {
    var result: [Double] = []
    for (index, position) in t.enumerated() where position >= from && position <= to {
      result.append(values[index])
    }
    return result
  }

  private static func width(_ across: [Double], t: [Double], from: Double, to: Double) -> Double {
    let values = slice(across, t: t, from: from, to: to).sorted()
    guard values.count >= 30 else { return 0 }
    return percentile(values, 0.99) - percentile(values, 0.01)
  }

  /// عریض‌ترین مقطع پا را با پیمایش نواری ۱۰ درصدی پیدا می‌کند.
  private static func maximumBinWidth(_ across: [Double], t: [Double]) -> Double {
    var best: Double = 0
    var start = 0.05
    while start < 0.95 {
      best = max(best, width(across, t: t, from: start, to: start + 0.10))
      start += 0.05
    }
    return best
  }

  private static func meanHeight(_ heights: [Double], t: [Double], from: Double, to: Double) -> Double {
    let values = slice(heights, t: t, from: from, to: to)
    guard !values.isEmpty else { return 0 }
    return values.reduce(0, +) / Double(values.count)
  }

  private static func heightPercentile(_ heights: [Double], t: [Double], from: Double, to: Double, p: Double) -> Double {
    let values = slice(heights, t: t, from: from, to: to).sorted()
    guard values.count >= 20 else { return 0 }
    return percentile(values, p)
  }

  /// محیط بیضی با تقریب رامانوجان؛ برای دور پنجه نیم‌کمان بالا به‌علاوه‌ی پایه‌ی صاف.
  private static func ballGirth(width: Double, height: Double) -> Double {
    guard width > 0, height > 0 else { return 0 }
    let a = width / 2
    let b = height
    let h = pow(a - b, 2) / pow(a + b, 2)
    let ellipse = Double.pi * (a + b) * (1 + (3 * h) / (10 + sqrt(4 - 3 * h)))
    return ellipse / 2 + width
  }

  /// نسبت نوارهای طولی پا که در آن‌ها نقطه ثبت شده است.
  private static func coverage(t: [Double]) -> Double {
    let bins = 40
    var occupied = Set<Int>()
    for position in t where position >= 0 && position <= 1 {
      occupied.insert(min(bins - 1, Int(position * Double(bins))))
    }
    return Double(occupied.count) / Double(bins)
  }
}
