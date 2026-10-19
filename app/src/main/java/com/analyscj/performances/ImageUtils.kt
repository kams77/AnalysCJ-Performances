package com.analyscj.performances

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Base64
import java.io.ByteArrayOutputStream
import kotlin.math.max

object ImageUtils {

    /** Une capture prête à être envoyée : JPEG réduit + miniature pour l'affichage. */
    class Shot(val jpeg: ByteArray, val thumb: Bitmap) {
        val base64: String
            get() = Base64.encodeToString(jpeg, Base64.NO_WRAP)
    }

    fun load(context: Context, uri: Uri, maxSide: Int = 1600): Shot? {
        val resolver = context.contentResolver

        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        resolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, bounds) }
        if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return null

        var sample = 1
        while (max(bounds.outWidth, bounds.outHeight) / sample > maxSide * 2) sample *= 2

        val opts = BitmapFactory.Options().apply { inSampleSize = sample }
        val bmp = resolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, opts) }
            ?: return null

        val scale = maxSide.toFloat() / max(bmp.width, bmp.height)
        val scaled = if (scale < 1f) {
            Bitmap.createScaledBitmap(
                bmp,
                max(1, (bmp.width * scale).toInt()),
                max(1, (bmp.height * scale).toInt()),
                true
            )
        } else {
            bmp
        }

        val out = ByteArrayOutputStream()
        scaled.compress(Bitmap.CompressFormat.JPEG, 82, out)

        val tScale = 240f / max(scaled.width, scaled.height)
        val thumb = Bitmap.createScaledBitmap(
            scaled,
            max(1, (scaled.width * tScale).toInt()),
            max(1, (scaled.height * tScale).toInt()),
            true
        )
        return Shot(out.toByteArray(), thumb)
    }
}
