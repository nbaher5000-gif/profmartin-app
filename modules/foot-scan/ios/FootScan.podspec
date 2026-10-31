Pod::Spec.new do |s|
  s.name           = 'FootScan'
  s.version        = '1.0.0'
  s.summary        = 'اسکن سه‌بعدی پا با LiDAR برای اپ پروفسور مارتین'
  s.description    = 'ماژول ARKit که از سنسور LiDAR ابر نقاط پا را می‌سازد و طول، عرض، دور پنجه و ارتفاع روی پا را اندازه می‌گیرد.'
  s.author         = 'Professor Martin'
  s.homepage       = 'https://profmartin.co'
  s.license        = { :type => 'Proprietary' }
  s.platforms      = { :ios => '15.1' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
