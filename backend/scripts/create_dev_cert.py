from datetime import datetime, timedelta, timezone
from pathlib import Path
import ipaddress
import sys

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID


BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(BACKEND_ROOT))

from app.utils.network import get_lan_ip


CERT_DIR = BACKEND_ROOT / "certs"
CERT_PATH = CERT_DIR / "cert.pem"
KEY_PATH = CERT_DIR / "key.pem"


def create_certificate() -> None:
    CERT_DIR.mkdir(parents=True, exist_ok=True)

    key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )

    subject = x509.Name(
        [
            x509.NameAttribute(NameOID.COMMON_NAME, "Cortext Local"),
        ]
    )

    now = datetime.now(timezone.utc)

    alt_names = [
        x509.DNSName("localhost"),
        x509.IPAddress(ipaddress.ip_address("127.0.0.1")),
        x509.IPAddress(ipaddress.ip_address(get_lan_ip())),
    ]

    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(subject)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now)
        .not_valid_after(now + timedelta(days=365))
        .add_extension(x509.SubjectAlternativeName(alt_names), critical=False)
        .sign(key, hashes.SHA256())
    )

    KEY_PATH.write_bytes(
        key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption(),
        )
    )
    CERT_PATH.write_bytes(cert.public_bytes(serialization.Encoding.PEM))


def main() -> None:
    if CERT_PATH.exists() and KEY_PATH.exists():
        print("Local HTTPS certificate already exists.")
        return

    create_certificate()
    print("Created local HTTPS certificate.")


if __name__ == "__main__":
    main()
