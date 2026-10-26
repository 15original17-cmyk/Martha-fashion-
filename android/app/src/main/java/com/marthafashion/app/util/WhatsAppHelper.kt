package com.marthafashion.app.util

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import java.net.URLEncoder

object WhatsAppHelper {

    fun generateOrderMessage(
        produitNom: String,
        taille: String,
        couleur: String,
        quantite: Int,
        prixTotal: String,
        clientNom: String,
        clientTelephone: String,
        lieu: String,
        message: String = ""
    ): String {
        val base = """
Bonjour Martha Fashion,

Je souhaite passer cette commande :

Produit : $produitNom
Taille : $taille
Couleur : $couleur
Quantité : $quantite
Prix : $prixTotal

Nom : $clientNom
Téléphone : $clientTelephone
Lieu : $lieu
""".trimIndent()

        return if (message.isNotBlank()) {
            "$base\n\nMessage : $message\n\nMerci."
        } else {
            "$base\n\nMerci."
        }
    }

    fun openWhatsApp(context: Context, rawPhone: String, messageText: String) {
        val cleanPhone = rawPhone.replace(Regex("[^0-9]"), "")
        val encodedMsg = try {
            URLEncoder.encode(messageText, "UTF-8")
        } catch (e: Exception) {
            messageText
        }
        val uriString = "https://api.whatsapp.com/send?phone=$cleanPhone&text=$encodedMsg"
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(uriString)).apply {
            setPackage("com.whatsapp")
        }
        try {
            context.startActivity(intent)
        } catch (e: Exception) {
            // Fallback: without explicit package or browser
            val fallbackIntent = Intent(Intent.ACTION_VIEW, Uri.parse(uriString))
            try {
                context.startActivity(fallbackIntent)
            } catch (ex: Exception) {
                Toast.makeText(context, "WhatsApp n'est pas installé sur votre téléphone.", Toast.LENGTH_LONG).show()
            }
        }
    }
}
