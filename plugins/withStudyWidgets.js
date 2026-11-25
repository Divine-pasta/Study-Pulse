
const {
  withAndroidManifest,
  withMainApplication,
  withDangerousMod,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function withWidgetFiles(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const androidResDir = path.join(projectRoot, 'android/app/src/main/res');
      const pkg = cfg.android?.package || 'com.yourname.studypulse';
      const pkgPath = path.join(
        projectRoot,
        'android/app/src/main/java',
        ...pkg.split('.')
      );

      fs.mkdirSync(path.join(androidResDir, 'layout'), { recursive: true });
      fs.mkdirSync(path.join(androidResDir, 'xml'), { recursive: true });
      fs.mkdirSync(pkgPath, { recursive: true });

      const srcDir = path.join(projectRoot, 'widget-assets/android');

      for (const file of ['widget_countdown.xml', 'widget_todo.xml']) {
        fs.copyFileSync(
          path.join(srcDir, 'res/layout', file),
          path.join(androidResDir, 'layout', file)
        );
      }
      for (const file of ['widget_countdown_info.xml', 'widget_todo_info.xml']) {
        fs.copyFileSync(
          path.join(srcDir, 'res/xml', file),
          path.join(androidResDir, 'xml', file)
        );
      }
      for (const file of [
        'CountdownWidgetProvider.kt',
        'TodoWidgetProvider.kt',
        'WidgetBridgeModule.kt',
        'WidgetBridgePackage.kt',
      ]) {
        const content = fs
          .readFileSync(path.join(srcDir, file), 'utf8')
          .replace(/^package\s+[\w.]+/m, `package ${pkg}`);
        fs.writeFileSync(path.join(pkgPath, file), content);
      }

      return cfg;
    },
  ]);
}

function withWidgetManifest(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (!app) return cfg;

    app.receiver = app.receiver || [];
    const receivers = [
      {
        name: '.CountdownWidgetProvider',
        label: 'Exam Countdown',
        resource: '@xml/widget_countdown_info',
      },
      {
        name: '.TodoWidgetProvider',
        label: 'Study To-Do',
        resource: '@xml/widget_todo_info',
      },
    ];

    for (const item of receivers) {
      if (!app.receiver.some((r) => r.$['android:name'] === item.name)) {
        app.receiver.push({
          $: {
            'android:name': item.name,
            'android:label': item.label,
            'android:exported': 'true',
          },
          'intent-filter': [
            {
              action: [
                { $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } },
              ],
            },
          ],
          'meta-data': [
            {
              $: {
                'android:name': 'android.appwidget.provider',
                'android:resource': item.resource,
              },
            },
          ],
        });
      }
    }

    return cfg;
  });
}

function withWidgetPackage(config) {
  return withMainApplication(config, (cfg) => {
    let contents = cfg.modResults.contents;
    if (!contents.includes('WidgetBridgePackage()')) {
      contents = contents.replace(
        'PackageList(this).packages.apply {',
        'PackageList(this).packages.apply {\n              add(WidgetBridgePackage())'
      );
      cfg.modResults.contents = contents;
    }
    return cfg;
  });
}

module.exports = function withStudyWidgets(config) {
  config = withWidgetFiles(config);
  config = withWidgetManifest(config);
  config = withWidgetPackage(config);
  return config;
};
