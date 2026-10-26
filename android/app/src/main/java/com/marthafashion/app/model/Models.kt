package com.marthafashion.app.model

data class Product(
    val id: String,
    val nom: String,
    val description: String,
    val prix: Int,
    val categorieId: String,
    val categorieNom: String,
    val photos: List<String>,
    val tailles: List<String>,
    val couleurs: List<String>,
    val disponible: Boolean,
    val nouveaute: Boolean = false,
    val populaire: Boolean = false,
    val promotion: Boolean = false,
    val prixPromo: Int? = null
)

data class Category(
    val id: String,
    val nom: String,
    val slug: String,
    val image: String
)

data class Order(
    val id: String,
    val numero: String,
    val date: String,
    val clientNom: String,
    val clientTelephone: String,
    val produitNom: String,
    val taille: String,
    val couleur: String,
    val quantite: Int,
    val prixUnitaire: Int,
    val prixTotal: Int,
    val lieuLivraison: String,
    val message: String = "",
    val statut: OrderStatus = OrderStatus.NOUVELLE
)

enum class OrderStatus(val label: String) {
    NOUVELLE("Nouvelle"),
    CONFIRMEE("Confirmée"),
    TERMINEE("Terminée"),
    ANNULEE("Annulée")
}

data class BoutiqueSettings(
    val nomBoutique: String = "MARTHA FASHION",
    val slogan: String = "L'élégance qui vous ressemble",
    val whatsapp: String = "+228 90 12 34 56",
    val telephone: String = "+228 90 12 34 56",
    val localisation: String = "Djagblé, Togo (Grand Lomé)",
    val instagram: String = "@marthafashion.officiel",
    val facebook: String = "Martha Fashion Djagblé",
    val tiktok: String = "@marthafashion",
    val codeAdmin: String = "martha2024"
)
