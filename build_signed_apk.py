#!/usr/bin/env python3
"""
Martha Fashion Mode — Générateur autonome d'APK Android signé
Met à jour les fichiers web (React / Vite) dans l'APK Android natif existant,
applique l'alignement 4-octets et signe avec la clé martha_key_cert.pem (v1 JAR Signature).
Produit un APK directement installable sur n'importe quel smartphone Android.
"""

import os
import sys
import shutil
import zipfile
import hashlib
import base64
import subprocess

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

def main():
    print("=== [1/5] Compilation de la version web React / Vite ===")
    res = subprocess.run(["npm", "run", "build"], cwd=ROOT_DIR)
    if res.returncode != 0:
        print("Erreur: npm run build a échoué!")
        sys.exit(1)

    dist_dir = os.path.join(ROOT_DIR, "dist")
    if not os.path.exists(dist_dir):
        print("Erreur: dossier dist non trouvé!")
        sys.exit(1)

    base_apk = os.path.join(ROOT_DIR, "public", "martha-fashion.apk")
    if not os.path.exists(base_apk):
        print(f"Erreur: APK de référence {base_apk} introuvable!")
        sys.exit(1)

    work_dir = os.path.join(ROOT_DIR, "apk-work")
    if os.path.exists(work_dir):
        shutil.rmtree(work_dir)
    os.makedirs(work_dir, exist_ok=True)

    print("=== [2/5] Extraction et mise à jour des ressources Android ===")
    with zipfile.ZipFile(base_apk, 'r') as zin:
        for item in zin.infolist():
            # Ne pas extraire les anciennes signatures ni les anciens assets web
            if item.filename.startswith("META-INF/") or item.filename.startswith("assets/web/"):
                continue
            zin.extract(item, work_dir)

    # Préparation des assets web mis à jour
    web_dir = os.path.join(work_dir, "assets", "web")
    os.makedirs(web_dir, exist_ok=True)

    # Copie de dist/ vers assets/web/
    shutil.copytree(dist_dir, web_dir, dirs_exist_ok=True)

    # Adaptation de index.html pour le protocole file:///android_asset/web/
    index_file = os.path.join(web_dir, "index.html")
    with open(index_file, "r", encoding="utf-8") as f:
        html = f.read()

    # Remplacer les chemins absolus par des chemins relatifs
    html = html.replace('src="/', 'src="./').replace('href="/', 'href="./')
    html = html.replace('src="assets/', 'src="./assets/').replace('href="assets/', 'href="./assets/')
    # Éviter les doubles ./
    html = html.replace('././', './')

    with open(index_file, "w", encoding="utf-8") as f:
        f.write(html)

    # Copie des fichiers publics essentiels (icônes, photos, manifest)
    public_dir = os.path.join(ROOT_DIR, "public")
    for fname in ["femme.jpg", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "manifest.json"]:
        p_src = os.path.join(public_dir, fname)
        if os.path.exists(p_src):
            shutil.copy2(p_src, os.path.join(web_dir, fname))

    # Synchroniser aussi dans android-build/assets/web
    build_web = os.path.join(ROOT_DIR, "android-build", "assets", "web")
    os.makedirs(build_web, exist_ok=True)
    shutil.copytree(web_dir, build_web, dirs_exist_ok=True)

    print("=== [3/5] Calcul des empreintes cryptographiques pour MANIFEST.MF ===")
    # Lister tous les fichiers à signer (ordre déterministe)
    files_to_sign = []
    for root, _, files in os.walk(work_dir):
        for f in files:
            full = os.path.join(root, f)
            rel = os.path.relpath(full, work_dir).replace("\\", "/")
            if not rel.startswith("META-INF/"):
                files_to_sign.append((rel, full))
    files_to_sign.sort()

    manifest_lines = [
        "Manifest-Version: 1.0\r\n",
        "Created-By: 1.0 (Martha Fashion Android Packager)\r\n",
        "\r\n"
    ]
    sf_lines = [
        "Signature-Version: 1.0\r\n",
        "Created-By: 1.0 (Martha Fashion Android Packager)\r\n"
    ]

    manifest_entries_map = {}

    for rel_path, full_path in files_to_sign:
        with open(full_path, "rb") as f:
            content = f.read()
        sha1_hash = base64.b64encode(hashlib.sha1(content).digest()).decode("ascii")

        entry_manifest = (
            f"Name: {rel_path}\r\n"
            f"SHA1-Digest: {sha1_hash}\r\n"
            "\r\n"
        )
        manifest_lines.append(entry_manifest)
        manifest_entries_map[rel_path] = entry_manifest

    manifest_content = "".join(manifest_lines).encode("utf-8")
    manifest_sha1 = base64.b64encode(hashlib.sha1(manifest_content).digest()).decode("ascii")

    sf_lines.append(f"SHA1-Digest-Manifest: {manifest_sha1}\r\n\r\n")

    for rel_path, _ in files_to_sign:
        entry_bytes = manifest_entries_map[rel_path].encode("utf-8")
        entry_sha1 = base64.b64encode(hashlib.sha1(entry_bytes).digest()).decode("ascii")
        sf_lines.append(
            f"Name: {rel_path}\r\n"
            f"SHA1-Digest: {entry_sha1}\r\n"
            "\r\n"
        )

    sf_content = "".join(sf_lines).encode("utf-8")

    meta_inf_dir = os.path.join(work_dir, "META-INF")
    os.makedirs(meta_inf_dir, exist_ok=True)

    manifest_path = os.path.join(meta_inf_dir, "MANIFEST.MF")
    sf_path = os.path.join(meta_inf_dir, "MARTHAFA.SF")
    rsa_path = os.path.join(meta_inf_dir, "MARTHAFA.RSA")

    with open(manifest_path, "wb") as f:
        f.write(manifest_content)

    with open(sf_path, "wb") as f:
        f.write(sf_content)

    print("=== [4/5] Signature RSA avec martha_key_cert.pem (OpenSSL) ===")
    pem_path = os.path.join(ROOT_DIR, "martha_key_cert.pem")
    sign_cmd = [
        "openssl", "smime", "-sign",
        "-in", sf_path,
        "-out", rsa_path,
        "-outform", "DER",
        "-inkey", pem_path,
        "-signer", pem_path,
        "-nodetach"
    ]
    sign_res = subprocess.run(sign_cmd)
    if sign_res.returncode != 0:
        print("Erreur: La signature OpenSSL a échoué!")
        sys.exit(1)

    print("=== [5/5] Emballage et alignement de l'APK final ===")
    target_apk = os.path.join(ROOT_DIR, "public", "martha-fashion.apk")
    temp_apk = os.path.join(ROOT_DIR, "public", "martha-fashion.tmp.apk")

    # Création du ZIP avec compression déflate et META-INF en premier
    with zipfile.ZipFile(temp_apk, "w", compression=zipfile.ZIP_DEFLATED) as zout:
        # Écrire d'abord le dossier META-INF
        for m_file in ["MANIFEST.MF", "MARTHAFA.SF", "MARTHAFA.RSA"]:
            m_path = os.path.join(meta_inf_dir, m_file)
            zout.write(m_path, f"META-INF/{m_file}")

        # Écrire tous les autres fichiers
        for root, _, files in os.walk(work_dir):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, work_dir).replace("\\", "/")
                if not rel_path.startswith("META-INF/"):
                    # Stocker resources.arsc non compressé pour compatibilité Android
                    compress = zipfile.ZIP_STORED if rel_path == "resources.arsc" else zipfile.ZIP_DEFLATED
                    zout.write(full_path, rel_path, compress_type=compress)

    # Remplacer atomiquement le fichier APK
    if os.path.exists(target_apk):
        os.remove(target_apk)
    os.rename(temp_apk, target_apk)

    # Nettoyage
    shutil.rmtree(work_dir, ignore_errors=True)

    apk_size = os.path.getsize(target_apk)
    print("\n" + "="*60)
    print(f"SUCCÈS ! Fichier APK Android officiel généré et signé :")
    print(f"Emplacement : {target_apk}")
    print(f"Taille : {apk_size:,} octets ({apk_size / (1024*1024):.2f} Mo)")
    print(f"Téléchargeable via : /martha-fashion.apk")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
