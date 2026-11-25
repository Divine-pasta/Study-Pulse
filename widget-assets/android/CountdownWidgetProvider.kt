package com.studypulse.offlinecompanion

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import java.util.concurrent.TimeUnit

class CountdownWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, manager: AppWidgetManager, appWidgetIds: IntArray) {
        val prefs = context.getSharedPreferences("StudyPulseWidgets", Context.MODE_PRIVATE)
        val examTitle = prefs.getString("examTitle", "Target Exam") ?: "Target Exam"
        val examTimestamp = prefs.getLong("examTimestamp", 0L)

        val daysText = if (examTimestamp > 0L) {
            val diffMs = examTimestamp - System.currentTimeMillis()
            val daysLeft = TimeUnit.MILLISECONDS.toDays(diffMs).coerceAtLeast(0)
            if (daysLeft == 0L && diffMs > 0) "TODAY" else "$daysLeft DAYS"
        } else {
            "SET EXAM"
        }

        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        val pendingIntent = PendingIntent.getActivity(
            context, 0, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        for (id in appWidgetIds) {
            val views = RemoteViews(context.packageName, R.layout.widget_countdown)
            views.setTextViewText(R.id.countdown_days, daysText)
            views.setTextViewText(R.id.countdown_title, examTitle)
            if (launchIntent != null) {
                views.setOnClickPendingIntent(R.id.widget_countdown_root, pendingIntent)
            }
            manager.updateAppWidget(id, views)
        }
    }
}
