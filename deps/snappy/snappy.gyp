{'targets': [{
    'variables': {
        'conditions': [
            ['OS=="linux"',   {'os_include': 'linux'}]
          , ['OS=="mac"',     {'os_include': 'mac'}]
          , ['OS=="solaris"', {'os_include': 'solaris'}]
          , ['OS=="win"',     {'os_include': 'win32'}]
        ]
    }
  , 'target_name': 'snappy'
  , 'type': 'static_library'
  , 'include_dirs': [
        '<(os_include)'
      , 'snappy-1.0.5'
    ]
  , 'direct_dependent_settings': {
        'include_dirs': [
            '<(os_include)'
          , 'snappy-1.0.5'
        ]
    }
  , 'conditions': [
        ['OS == "linux"', {
            'cflags': [
                '-Wno-sign-compare'
              , '-Wno-unused-function'
            ]
        }]
      , ['OS == "solaris"', {
            'cflags': [
                '-Wno-sign-compare'
              , '-Wno-unused-function'
            ]
        }]
      , ['OS == "mac"', {
            'cflags': [
                '-Wno-sign-compare'
              , '-Wno-unused-function'
            ]
        }]
    ]
  , 'sources': [
        'snappy-1.0.5/snappy-internal.h'
      , 'snappy-1.0.5/snappy-sinksource.cc'
      , 'snappy-1.0.5/snappy-sinksource.h'
      , 'snappy-1.0.5/snappy-stubs-internal.cc'
      , 'snappy-1.0.5/snappy-stubs-internal.h'
      , 'snappy-1.0.5/snappy.cc'
      , 'snappy-1.0.5/snappy.h'
    ]
}]}