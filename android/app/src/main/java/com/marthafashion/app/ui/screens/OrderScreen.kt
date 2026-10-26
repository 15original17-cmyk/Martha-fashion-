package com.marthafashion.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.marthafashion.app.data.MarthaRepository
import com.marthafashion.app.model.Order
import com.marthafashion.app.theme.*
import com.marthafashion.app.util.WhatsAppHelper
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun OrderScreen(
    productId: String,
    onBackClick: () -> Unit,
    onOrderCompleted: () -> Unit
) {
    val context = LocalContext.current
    val products by MarthaRepository.products.collectAsState()
    val settings by MarthaRepository.settings.collectAsState()
    val product = products.find { it.id == productId }

    if (product == null) {
        Box(modifier = Modifier.fillMaxSize().background(NoirBg).padding(20.dp)) {
            Text("Produit introuvable", color = BlancText)
        }
        return
    }

    var clientNom by remember { mutableStateOf("") }
    var clientTelephone by remember { mutableStateOf("") }
    var selectedTaille by remember { mutableStateOf(product.tailles.firstOrNull() ?: "Standard") }
    var selectedCouleur by remember { mutableStateOf(product.couleurs.firstOrNull() ?: "Standard") }
    var quantite by remember { mutableStateOf(1) }
    var lieuLivraison by remember { mutableStateOf("Djagblé / Lomé") }
    var messageOptionnel by remember { mutableStateOf("") }

    val prixTotal = product.prix * quantite

    Scaffold(
        topBar = {
            SmallTopAppBar(
                title = { Text("Commander — ${product.nom}", color = BlancText) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Retour", tint = GoldLight)
                    }
                },
                colors = TopAppBarDefaults.smallTopAppBarColors(containerColor = NoirCard)
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(NoirBg)
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            item {
                Text(
                    text = "Formulaire de commande",
                    style = MaterialTheme.typography.headlineSmall,
                    color = GoldLight
                )
            }

            // Client Nom
            item {
                OutlinedTextField(
                    value = clientNom,
                    onValueChange = { clientNom = it },
                    label = { Text("Votre nom complet *", color = MutedText) },
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
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
            }

            // Telephone
            item {
                OutlinedTextField(
                    value = clientTelephone,
                    onValueChange = { clientTelephone = it },
                    label = { Text("Numéro de téléphone WhatsApp *", color = MutedText) },
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
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
            }

            // Lieu
            item {
                OutlinedTextField(
                    value = lieuLivraison,
                    onValueChange = { lieuLivraison = it },
                    label = { Text("Lieu de livraison / retrait *", color = MutedText) },
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
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
            }

            // Message facultatif
            item {
                OutlinedTextField(
                    value = messageOptionnel,
                    onValueChange = { messageOptionnel = it },
                    label = { Text("Message facultatif ou mesures spécifiques", color = MutedText) },
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = NoirCard,
                        unfocusedContainerColor = NoirCard,
                        focusedBorderColor = GoldPrimary,
                        unfocusedBorderColor = NoirBorder,
                        focusedTextColor = BlancText,
                        unfocusedTextColor = BlancText
                    ),
                    modifier = Modifier.fillMaxWidth().height(100.dp)
                )
            }

            // Récapitulatif
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = NoirElevated),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Récapitulatif de votre commande", color = GoldLight, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Produit : ${product.nom}", color = BlancText, fontSize = 13.sp)
                        Text("Taille : $selectedTaille", color = BlancText, fontSize = 13.sp)
                        Text("Couleur : $selectedCouleur", color = BlancText, fontSize = 13.sp)
                        Text("Quantité : $quantite", color = BlancText, fontSize = 13.sp)
                        Text(
                            "Total à régler : $prixTotal FCFA",
                            color = GoldLight,
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            modifier = Modifier.padding(top = 8.dp)
                        )
                    }
                }
            }

            // Bouton Commander sur WhatsApp
            item {
                Button(
                    onClick = {
                        if (clientNom.isBlank() || clientTelephone.isBlank()) {
                            return@Button
                        }
                        val orderNumber = "CMD-${System.currentTimeMillis().toString().takeLast(5)}"
                        val dateNow = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault()).format(Date())
                        val newOrder = Order(
                            id = UUID.randomUUID().toString(),
                            numero = orderNumber,
                            date = dateNow,
                            clientNom = clientNom,
                            clientTelephone = clientTelephone,
                            produitNom = product.nom,
                            taille = selectedTaille,
                            couleur = selectedCouleur,
                            quantite = quantite,
                            prixUnitaire = product.prix,
                            prixTotal = prixTotal,
                            lieuLivraison = lieuLivraison,
                            message = messageOptionnel
                        )
                        MarthaRepository.addOrder(newOrder)

                        val whatsAppMsg = WhatsAppHelper.generateOrderMessage(
                            produitNom = product.nom,
                            taille = selectedTaille,
                            couleur = selectedCouleur,
                            quantite = quantite,
                            prixTotal = "$prixTotal FCFA",
                            clientNom = clientNom,
                            clientTelephone = clientTelephone,
                            lieu = lieuLivraison,
                            message = messageOptionnel
                        )
                        WhatsAppHelper.openWhatsApp(context, settings.whatsapp, whatsAppMsg)
                        onOrderCompleted()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = GoldPrimary),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth().height(52.dp)
                ) {
                    Icon(Icons.Default.Send, contentDescription = null, tint = NoirBg)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        "ENVOYER LA COMMANDE SUR WHATSAPP",
                        color = NoirBg,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                }
            }
        }
    }
}
