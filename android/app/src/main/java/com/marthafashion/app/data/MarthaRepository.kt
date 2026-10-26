package com.marthafashion.app.data

import com.marthafashion.app.model.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

object MarthaRepository {

    val categories = listOf(
        Category("cat-femme", "Femme", "femme", "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80"),
        Category("cat-homme", "Homme", "homme", "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80"),
        Category("cat-enfant", "Enfant", "enfant", "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=800&q=80"),
        Category("cat-sur-mesure", "Sur mesure", "sur-mesure", "https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=800&q=80"),
        Category("cat-accessoires", "Accessoires", "accessoires", "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=800&q=80")
    )

    private val initialProducts = listOf(
        Product(
            id = "prod-1",
            nom = "Robe Wax Cérémonie Martha",
            description = "Création signature en véritable tissu Wax hollandais haut de gamme. Coupe trapèze moderne avec finitions dorées à la main.",
            prix = 28000,
            categorieId = "cat-femme",
            categorieNom = "Femme",
            photos = listOf(
                "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80"
            ),
            tailles = listOf("S", "M", "L", "XL", "Sur mesure"),
            couleurs = listOf("Doré / Noir", "Bleu Indigo", "Terracotta"),
            disponible = true,
            nouveaute = true,
            populaire = true
        ),
        Product(
            id = "prod-2",
            nom = "Ensemble Bazin Riche Homme",
            description = "Boubou 3 pièces en bazin riche teinté artisanalement avec broderies royales dorées au fil de soie.",
            prix = 45000,
            categorieId = "cat-homme",
            categorieNom = "Homme",
            photos = listOf(
                "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=800&q=80"
            ),
            tailles = listOf("M", "L", "XL", "XXL", "Sur mesure"),
            couleurs = listOf("Blanc & Or", "Noir Royal", "Bleu Nuit"),
            disponible = true,
            populaire = true
        ),
        Product(
            id = "prod-3",
            nom = "Robe Petite Princesse Wax Enfant",
            description = "Robe festive avec ruban de satin et doublure en coton doux 100% respirant pour le confort des petites demoiselles.",
            prix = 15000,
            categorieId = "cat-enfant",
            categorieNom = "Enfant",
            photos = listOf(
                "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=800&q=80"
            ),
            tailles = listOf("2-4 ans", "5-7 ans", "8-10 ans", "11-14 ans"),
            couleurs = listOf("Rose Poudré & Or", "Jaune Solaire"),
            disponible = true,
            nouveaute = true
        ),
        Product(
            id = "prod-4",
            nom = "Tenue de Mariage Traditionnel Sur Mesure",
            description = "Confection exclusive sur mesure pour mariée ou cortège d'honneur. Prise de mesures à domicile ou à l'atelier de Djagblé.",
            prix = 85000,
            categorieId = "cat-sur-mesure",
            categorieNom = "Sur mesure",
            photos = listOf(
                "https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80"
            ),
            tailles = listOf("Sur mesure uniquement"),
            couleurs = listOf("Doré / Champagne", "Bordeaux Impérial", "Émeraude"),
            disponible = true,
            populaire = true
        ),
        Product(
            id = "prod-5",
            nom = "Sac À Main Wax & Cuir Artisanal",
            description = "Accessoire luxe fait main associant cuir d'agneau noir et tissu wax verni avec bandoulière réglable.",
            prix = 18500,
            categorieId = "cat-accessoires",
            categorieNom = "Accessoires",
            photos = listOf(
                "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=800&q=80"
            ),
            tailles = listOf("Taille Unique"),
            couleurs = listOf("Noir & Or", "Multicolore Chaud"),
            disponible = true,
            promotion = true,
            prixPromo = 15000
        )
    )

    private val _products = MutableStateFlow(initialProducts)
    val products: StateFlow<List<Product>> = _products.asStateFlow()

    private val _orders = MutableStateFlow<List<Order>>(emptyList())
    val orders: StateFlow<List<Order>> = _orders.asStateFlow()

    private val _settings = MutableStateFlow(BoutiqueSettings())
    val settings: StateFlow<BoutiqueSettings> = _settings.asStateFlow()

    fun addOrder(order: Order) {
        _orders.value = listOf(order) + _orders.value
    }

    fun updateOrderStatus(orderId: String, newStatus: OrderStatus) {
        _orders.value = _orders.value.map {
            if (it.id == orderId) it.copy(statut = newStatus) else it
        }
    }

    fun updateSettings(newSettings: BoutiqueSettings) {
        _settings.value = newSettings
    }
}
