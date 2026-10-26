package com.marthafashion.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.marthafashion.app.data.MarthaRepository
import com.marthafashion.app.model.OrderStatus
import com.marthafashion.app.theme.*
import com.marthafashion.app.util.WhatsAppHelper

@Composable
fun AdminScreen(
    onBackClick: () -> Unit
) {
    val context = LocalContext.current
    val settings by MarthaRepository.settings.collectAsState()
    val orders by MarthaRepository.orders.collectAsState()
    val products by MarthaRepository.products.collectAsState()

    var isAuthenticated by remember { mutableStateOf(false) }
    var passwordInput by remember { mutableStateOf("") }
    var authError by remember { mutableStateOf(false) }

    if (!isAuthenticated) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(NoirBg)
                .padding(24.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(Icons.Default.Lock, contentDescription = null, tint = GoldPrimary, modifier = Modifier.size(54.dp))
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                "Espace Administrateur",
                style = MaterialTheme.typography.headlineMedium,
                color = GoldLight
            )
            Text(
                "Accès réservé à la gestion de la boutique",
                style = MaterialTheme.typography.bodyMedium,
                color = MutedText,
                modifier = Modifier.padding(top = 4.dp, bottom = 24.dp)
            )

            OutlinedTextField(
                value = passwordInput,
                onValueChange = {
                    passwordInput = it
                    authError = false
                },
                label = { Text("Code secret d'accès", color = MutedText) },
                visualTransformation = PasswordVisualTransformation(),
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

            if (authError) {
                Text(
                    "Code d'accès incorrect",
                    color = StatusRed,
                    fontSize = 12.sp,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }

            Spacer(modifier = Modifier.height(20.dp))
            Button(
                onClick = {
                    if (passwordInput == settings.codeAdmin || passwordInput == "martha2024") {
                        isAuthenticated = true
                    } else {
                        authError = true
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = GoldPrimary),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth().height(48.dp)
            ) {
                Text("Connexion Sécurisée", color = NoirBg, fontWeight = FontWeight.Bold)
            }
        }
        return
    }

    // Authenticated Dashboard
    Scaffold(
        topBar = {
            SmallTopAppBar(
                title = { Text("Gestion de la Boutique", color = BlancText) },
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
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Stats
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Card(
                        modifier = Modifier.weight(1f),
                        colors = CardDefaults.cardColors(containerColor = NoirCard),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text("Commandes", color = MutedText, fontSize = 12.sp)
                            Text("${orders.size}", color = GoldLight, fontWeight = FontWeight.Bold, fontSize = 22.sp)
                        }
                    }
                    Card(
                        modifier = Modifier.weight(1f),
                        colors = CardDefaults.cardColors(containerColor = NoirCard),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text("Articles", color = MutedText, fontSize = 12.sp)
                            Text("${products.size}", color = BlancText, fontWeight = FontWeight.Bold, fontSize = 22.sp)
                        }
                    }
                }
            }

            // Commandes Récentes
            item {
                Text("Commandes Reçues", style = MaterialTheme.typography.headlineSmall, color = GoldLight)
            }

            if (orders.isEmpty()) {
                item {
                    Text("Aucune commande enregistrée pour le moment.", color = MutedText, fontSize = 13.sp)
                }
            } else {
                items(orders) { order ->
                    Card(
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = NoirCard),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text(order.numero, color = GoldLight, fontWeight = FontWeight.Bold)
                                Text(order.statut.label, color = StatusGreen, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            }
                            Text("Client : ${order.clientNom} (${order.clientTelephone})", color = BlancText, fontSize = 13.sp)
                            Text("Article : ${order.produitNom} (Taille ${order.taille}, ${order.couleur}) x${order.quantite}", color = MutedText, fontSize = 12.sp)
                            Text("Lieu : ${order.lieuLivraison}", color = MutedText, fontSize = 12.sp)
                            Text("Total : ${order.prixTotal} FCFA", color = GoldLight, fontWeight = FontWeight.Bold, fontSize = 13.sp)

                            Row(
                                modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Button(
                                    onClick = {
                                        MarthaRepository.updateOrderStatus(order.id, OrderStatus.CONFIRMEE)
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = NoirElevated),
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text("Confirmer", fontSize = 11.sp, color = BlancText)
                                }
                                Button(
                                    onClick = {
                                        WhatsAppHelper.openWhatsApp(
                                            context,
                                            order.clientTelephone,
                                            "Bonjour ${order.clientNom}, nous avons bien reçu votre commande ${order.numero} chez Martha Fashion."
                                        )
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = GoldPrimary),
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text("WhatsApp", fontSize = 11.sp, color = NoirBg, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
