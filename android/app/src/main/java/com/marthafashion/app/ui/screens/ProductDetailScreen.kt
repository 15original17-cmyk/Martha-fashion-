package com.marthafashion.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
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
fun ProductDetailScreen(
    productId: String,
    onBackClick: () -> Unit,
    onOrderClick: (String) -> Unit
) {
    val products by MarthaRepository.products.collectAsState()
    val product = products.find { it.id == productId }

    if (product == null) {
        Box(
            modifier = Modifier.fillMaxSize().background(NoirBg).padding(20.dp)
        ) {
            Text("Produit introuvable", color = BlancText)
        }
        return
    }

    Scaffold(
        topBar = {
            SmallTopAppBar(
                title = { Text(product.nom, color = BlancText, maxLines = 1) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Retour", tint = GoldLight)
                    }
                },
                colors = TopAppBarDefaults.smallTopAppBarColors(containerColor = NoirCard)
            )
        },
        bottomBar = {
            Surface(
                color = NoirCard,
                modifier = Modifier.fillMaxWidth().padding(16.dp)
            ) {
                Button(
                    onClick = { onOrderClick(product.id) },
                    colors = ButtonDefaults.buttonColors(containerColor = GoldPrimary),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth().height(52.dp)
                ) {
                    Text(
                        "COMMANDER SUR WHATSAPP",
                        color = NoirBg,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp
                    )
                }
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(NoirBg)
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Main Photo
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(340.dp)
                        .clip(RoundedCornerShape(20.dp))
                ) {
                    AsyncImage(
                        model = product.photos.firstOrNull() ?: "",
                        contentDescription = product.nom,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                }
            }

            // Additional photos
            if (product.photos.size > 1) {
                item {
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        items(product.photos) { photo ->
                            Box(
                                modifier = Modifier
                                    .size(80.dp)
                                    .clip(RoundedCornerShape(12.dp))
                            ) {
                                AsyncImage(
                                    model = photo,
                                    contentDescription = null,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize()
                                )
                            }
                        }
                    }
                }
            }

            // Name & Price
            item {
                Column {
                    Text(
                        text = product.nom,
                        style = MaterialTheme.typography.headlineMedium,
                        color = BlancText
                    )
                    Text(
                        text = "${product.prix} FCFA",
                        style = MaterialTheme.typography.headlineSmall,
                        color = GoldLight,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }

            // Description
            item {
                Text(
                    text = product.description,
                    style = MaterialTheme.typography.bodyLarge,
                    color = MutedText
                )
            }

            // Tailles disponibles
            item {
                Text("Tailles disponibles :", color = GoldLight, fontWeight = FontWeight.Bold)
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.padding(top = 8.dp)
                ) {
                    product.tailles.forEach { taille ->
                        AssistChip(
                            onClick = {},
                            label = { Text(taille, color = BlancText) },
                            colors = AssistChipDefaults.assistChipColors(containerColor = NoirElevated)
                        )
                    }
                }
            }

            // Couleurs disponibles
            item {
                Text("Couleurs disponibles :", color = GoldLight, fontWeight = FontWeight.Bold)
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.padding(top = 8.dp)
                ) {
                    product.couleurs.forEach { couleur ->
                        AssistChip(
                            onClick = {},
                            label = { Text(couleur, color = BlancText) },
                            colors = AssistChipDefaults.assistChipColors(containerColor = NoirElevated)
                        )
                    }
                }
            }
        }
    }
}
