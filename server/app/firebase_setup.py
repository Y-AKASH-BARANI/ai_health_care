"""
firebase_setup.py - Firebase Admin SDK Initialization
=====================================================

Initializes the Firebase Admin SDK for server-side Firestore access.
Requires a service account JSON key file. Set the path via the
GOOGLE_APPLICATION_CREDENTIALS environment variable, or place
``serviceAccountKey.json`` in the server/ directory.
"""

import os
import logging

import firebase_admin
from firebase_admin import credentials, firestore

logger = logging.getLogger(__name__)

_FALLBACK_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),  # server/
    "serviceAccountKey.json",
)


def _init_app() -> firestore.firestore.Client:
    """Initialize Firebase Admin and return a Firestore client."""
    cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", _FALLBACK_PATH)
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    logger.info("Firebase Admin initialized with service account: %s", cred_path)
    return firestore.client()


firestore_db = _init_app()
