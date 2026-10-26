package com.marthafashion.app.navigation

sealed class Screen(val route: String, val title: String) {
    object Home : Screen("home", "Accueil")
    object Catalog : Screen("catalog", "Catalogue")
    object ProductDetail : Screen("product_detail/{productId}", "Détail") {
        fun createRoute(productId: String) = "product_detail/$productId"
    }
    object Order : Screen("order/{productId}", "Commander") {
        fun createRoute(productId: String) = "order/$productId"
    }
    object Contact : Screen("contact", "Atelier")
    object Admin : Screen("admin", "Admin")
}
