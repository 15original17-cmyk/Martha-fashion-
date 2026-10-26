package com.marthafashion.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Sparkles
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.marthafashion.app.data.MarthaRepository
import com.marthafashion.app.model.Product
import com.marthafashion.app.theme.*

@Composable
fun HomeScreen(
    onNavigateToCatalog: () -> Unit,
    onProductClick: (String) -> Unit
) {
    val products by MarthaRepository.products.collectAsState()
    val settings by MarthaRepository.settings.collectAsState()

    val nouveautes = products.filter { it.nouveaute }
    val populaires = products.filter { it.populaire }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(NoirBg)
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        // Hero Header
        item {
            Spacer(modifier = Modifier.height(12.dp))
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(24.dp))
                    .background(
                        Brush.verticalGradient(
                            listOf(NoirElevated, NoirCard)
                        )
                    )
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = settings.nomBoutique,
                    style = MaterialTheme.typography.headlineLarge,
                    color = GoldLight,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 2.sp
                )
                Text(
                    text = "« ${settings.slogan} »",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MutedText,
                    modifier = Modifier.padding(top = 4.dp, bottom = 16.dp)
                )

                // Hero Image
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp)
                        .clip(RoundedCornerShape(16.dp))
                ) {
                    AsyncImage(
                        model = "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=1200&q=80",
                        contentDescription = "Haute Couture Martha Fashion",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = onNavigateToCatalog,
                    colors = ButtonDefaults.buttonColors(containerColor = GoldPrimary),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        "Voir nos créations",
                        color = NoirBg,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Icon(Icons.Default.ArrowForward, contentDescription = null, tint = NoirBg)
                }
            }
        }

        // Nouveautés
        item {
            SectionTitle("Nouveautés Exclusives", "Dernières créations de l'atelier")
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(14.dp),
                modifier = Modifier.padding(top = 10.dp)
            ) {
                items(nouveautes) { prod ->
                    ProductMiniCard(product = prod, onClick = { onProductClick(prod.id) })
                }
            }
        }

        // Populaires
        item {
            SectionTitle("Coups de Cœur & Populaires", "Les pièces les plus demandées")
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(14.dp),
                modifier = Modifier.padding(top = 10.dp)
            ) {
                items(populaires) { prod ->
                    ProductMiniCard(product = prod, onClick = { onProductClick(prod.id) })
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
fun SectionTitle(title: String, subtitle: String) {
    Column {
        Text(
            text = title,
            style = MaterialTheme.typography.headlineSmall,
            color = BlancText
        )
        Text(
            text = subtitle,
            style = MaterialTheme.typography.bodyMedium,
            color = MutedText
        )
    }
}

@Composable
fun ProductMiniCard(product: Product, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .width(170.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = NoirCard)
    ) {
        Column {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(180.dp)
            ) {
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
