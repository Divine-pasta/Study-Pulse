package com.studypulse.offlinecompanion

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews

class TodoWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, manager: AppWidgetManager, appWidgetIds: IntArray) {
        val prefs = context.getSharedPreferences("StudyPulseWidgets", Context.MODE_PRIVATE)
        val header = prefs.getString("todoHeader", "Study To-Do") ?: "Study To-Do"
        val body = prefs.getString("todoBody", "No pending tasks") ?: "No pending tasks"

        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        val pendingIntent = PendingIntent.getActivity(
            context, 1, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        for (id in appWidgetIds) {
            val views = RemoteViews(context.packageName, R.layout.widget_todo)
            views.setTextViewText(R.id.todo_header, header)
            views.setTextViewText(R.id.todo_items, body)
            if (launchIntent != null) {
                views.setOnClickPendingIntent(R.id.widget_todo_root, pendingIntent)
            }
            manager.updateAppWidget(id, views)
        }
    }
}

