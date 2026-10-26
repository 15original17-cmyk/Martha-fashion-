package com.marthafashion.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.*
import com.marthafashion.app.data.MarthaRepository
import com.marthafashion.app.navigation.Screen
import com.marthafashion.app.theme.*
import com.marthafashion.app.ui.screens.*

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MarthaFashionTheme {
                MarthaFashionApp()
            }
        }
    }
}

@Composable
fun MarthaFashionApp() {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val bottomNavItems = listOf(
        Screen.Home to Icons.Default.Home,
        Screen.Catalog to Icons.Default.GridView,
        Screen.Contact to Icons.Default.Place,
        Screen.Admin to Icons.Default.Lock
    )

    Scaffold(
        bottomBar = {
            NavigationBar(
                containerColor = NoirCard,
                contentColor = GoldLight
            ) {
                bottomNavItems.forEach { (screen, icon) ->
                    val selected = currentRoute == screen.route
                    NavigationBarItem(
                        selected = selected,
                        onClick = {
                            navController.navigate(screen.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = { Icon(icon, contentDescription = screen.title) },
                        label = {
                            Text(
                                screen.title,
                                fontSize = 11.sp,
                                fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal
                            )
                        },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = NoirBg,
                            selectedTextColor = GoldLight,
                            indicatorColor = GoldPrimary,
                            unselectedIconColor = MutedText,
                            unselectedTextColor = MutedText
                        )
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Home.route,
            modifier = Modifier
                .fillMaxSize()
                .background(NoirBg)
                .padding(innerPadding)
        ) {
            composable(Screen.Home.route) {
                HomeScreen(
                    onNavigateToCatalog = { navController.navigate(Screen.Catalog.route) },
                    onProductClick = { productId ->
                        navController.navigate(Screen.ProductDetail.createRoute(productId))
                    }
                )
            }
            composable(Screen.Catalog.route) {
                CatalogScreen(
                    onProductClick = { productId ->
                        navController.navigate(Screen.ProductDetail.createRoute(productId))
                    }
                )
            }
            composable(Screen.ProductDetail.route) { backStackEntry ->
                val productId = backStackEntry.arguments?.getString("productId") ?: ""
                ProductDetailScreen(
                    productId = productId,
                    onBackClick = { navController.popBackStack() },
                    onOrderClick = { id ->
                        navController.navigate(Screen.Order.createRoute(id))
                    }
                )
            }
            composable(Screen.Order.route) { backStackEntry ->
                val productId = backStackEntry.arguments?.getString("productId") ?: ""
                OrderScreen(
                    productId = productId,
                    onBackClick = { navController.popBackStack() },
                    onOrderCompleted = {
                        navController.navigate(Screen.Home.route) {
                            popUpTo(Screen.Home.route) { inclusive = true }
                        }
                    }
                )
            }
            composable(Screen.Contact.route) {
                ContactScreen()
            }
            composable(Screen.Admin.route) {
                AdminScreen(
                    onBackClick = { navController.popBackStack() }
                )
            }
        }
    }
}
