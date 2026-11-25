// WidgetBridgeModule.kt
package com.studypulse.offlinecompanion

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class WidgetBridgeModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "WidgetBridge"

    @ReactMethod
    fun updateWidgets(examTitle: String, examTimestamp: Double, todoHeader: String, todoBody: String) {
        val prefs = reactContext.getSharedPreferences("StudyPulseWidgets", Context.MODE_PRIVATE)
        prefs.edit()
            .putString("examTitle", examTitle)
            .putLong("examTimestamp", examTimestamp.toLong())
            .putString("todoHeader", todoHeader)
            .putString("todoBody", todoBody)
            .apply()

        refreshProvider(CountdownWidgetProvider::class.java)
        refreshProvider(TodoWidgetProvider::class.java)
    }

    private fun refreshProvider(providerClass: Class<*>) {
        val manager = AppWidgetManager.getInstance(reactContext)
        val ids = manager.getAppWidgetIds(ComponentName(reactContext, providerClass))
        if (ids.isNotEmpty()) {
            val intent = Intent(reactContext, providerClass).apply {
                action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
            }
            reactContext.sendBroadcast(intent)
        }
    }
}

