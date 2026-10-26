package com.marthafashion.app.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.marthafashion.app.data.MarthaRepository
import com.marthafashion.app.theme.*
import com.marthafashion.app.util.WhatsAppHelper

@Composable
fun ContactScreen() {
    val context = LocalContext.current
    val settings by MarthaRepository.settings.collectAsState()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(NoirBg)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = "Atelier Martha Fashion",
                style = MaterialTheme.typography.headlineMedium,
                color = GoldLight
            )
            Text(
                text = "Rencontrez notre équipe pour vos essayages et confection sur mesure.",
                style = MaterialTheme.typography.bodyMedium,
                color = MutedText,
                modifier = Modifier.padding(top = 4.dp)
            )
        }

        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = NoirCard),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row {
                        Icon(Icons.Default.LocationOn, contentDescription = null, tint = GoldPrimary)
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text("Adresse de l'atelier", color = GoldLight, fontWeight = FontWeight.Bold)
                            Text(settings.localisation, color = BlancText, fontSize = 13.sp)
                        }
                    }

                    Row {
                        Icon(Icons.Default.Call, contentDescription = null, tint = GoldPrimary)
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text("Service Client & Confection", color = GoldLight, fontWeight = FontWeight.Bold)
                            Text(settings.telephone, color = BlancText, fontSize = 13.sp)
                        }
                    }
                }
            }
        }

        item {
            Button(
                onClick = {
                    WhatsAppHelper.openWhatsApp(
                        context,
                        settings.whatsapp,
                        "Bonjour Martha Fashion, je souhaite des renseignements sur l'atelier et vos créations."
                    )
                },
                colors = ButtonDefaults.buttonColors(containerColor = GoldPrimary),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth().height(50.dp)
            ) {
                Text("Discuter avec l'atelier sur WhatsApp", color = NoirBg, fontWeight = FontWeight.Bold)
            }
        }
    }
}
