package com.marthafashion.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.marthafashion.app.data.MarthaRepository
import com.marthafashion.app.theme.*

@Composable
fun CatalogScreen(
    onProductClick: (String) -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedCategoryId by remember { mutableStateOf<String?>(null) }

    val products by MarthaRepository.products.collectAsState()
    val categories = MarthaRepository.categories

    val filteredProducts = products.filter { prod ->
        val matchesCategory = selectedCategoryId == null || prod.categorieId == selectedCategoryId
        val matchesSearch = searchQuery.isBlank() ||
                prod.nom.contains(searchQuery, ignoreCase = true) ||
                prod.description.contains(searchQuery, ignoreCase = true)
        matchesCategory && matchesSearch
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(NoirBg)
            .padding(16.dp)
    ) {
        Text(
            text = "Catalogue Créations",
            style = MaterialTheme.typography.headlineMedium,
            color = GoldLight,
            modifier = Modifier.padding(bottom = 12.dp)
        )

        // Search Bar
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Rechercher un modèle, tissu...", color = MutedText) },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = GoldPrimary) },
            singleLine = true,
            shape = RoundedCornerShape(14.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = NoirCard,
                unfocusedContainerColor = NoirCard,
                focusedBorderColor = GoldPrimary,
                unfocusedBorderColor = NoirBorder,
                focusedTextColor = BlancText,
                unfocusedTextColor = BlancText
            ),
            modifier = Modifier.fillMaxWidth()
        )

        // Category Pills
        ScrollableTabRow(
            selectedTabIndex = if (selectedCategoryId == null) 0 else categories.indexOfFirst { it.id == selectedCategoryId } + 1,
            containerColor = NoirBg,
            contentColor = GoldLight,
            edgePadding = 0.dp,
            divider = {},
            modifier = Modifier.padding(vertical = 12.dp)
        ) {
            Tab(
                selected = selectedCategoryId == null,
                onClick = { selectedCategoryId = null },
                text = { Text("Tous", fontWeight = if (selectedCategoryId == null) FontWeight.Bold else FontWeight.Normal) }
            )
            categories.forEach { cat ->
                Tab(
                    selected = selectedCategoryId == cat.id,
                    onClick = { selectedCategoryId = cat.id },
                    text = { Text(cat.nom, fontWeight = if (selectedCategoryId == cat.id) FontWeight.Bold else FontWeight.Normal) }
                )
            }
        }

        // Product Grid
        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
            modifier = Modifier.fillMaxSize()
        ) {
            items(filteredProducts) { product ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onProductClick(product.id) },
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = NoirCard)
                ) {
                    Column {
                        Box(modifier = Modifier.fillMaxWidth().height(190.dp)) {
                            AsyncImage(
                                model = product.photos.firstOrNull() ?: "",
                                contentDescription = product.nom,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.fillMaxSize()
                            )
                        }
                        Column(modifier = Modifier.padding(10.dp)) {
                            Text(
                                text = product.nom,
                                color = BlancText,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                                maxLines = 1
                            )
                            Text(
                                text = "${product.prix} FCFA",
                                color = GoldLight,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(top = 4.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}
