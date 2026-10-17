"""
PSL BiLSTM Classifier Architecture
===================================
Defines the deep Bidirectional LSTM classifier for Pakistani Sign Language.
Works with 45-frame sequence inputs of 258 features (Pose + Left Hand + Right Hand).
"""

import json
from pathlib import Path
from typing import Optional, Tuple

try:
    import tensorflow as tf
    from tensorflow.keras import layers, models
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False


def build_keras_bilstm(
    seq_len: int = 45,
    feature_dim: int = 258,
    num_classes: int = 31,
    hidden_dim: int = 128,
    dropout: float = 0.4
):
    """
    Builds a robust Bidirectional LSTM model with BatchNormalization and Dropout.
    Input shape: (seq_len, feature_dim) -> e.g. (45, 258)
    Output shape: (num_classes,) softmax probabilities
    """
    if not TF_AVAILABLE:
        raise ImportError("TensorFlow is required to build this model. Run: pip install tensorflow")

    model = models.Sequential([
        layers.Input(shape=(seq_len, feature_dim)),
        layers.Bidirectional(layers.LSTM(hidden_dim, return_sequences=True)),
        layers.Dropout(dropout),
        layers.Bidirectional(layers.LSTM(hidden_dim, return_sequences=False)),
        layers.Dropout(dropout),
        layers.BatchNormalization(),
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.3),
        layers.Dense(64, activation='relu'),
        layers.Dense(num_classes, activation='softmax')
    ])

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    return model


def build_conv1d_bilstm(
    seq_len: int = 45,
    feature_dim: int = 462,
    num_classes: int = 31,
    conv_filters: int = 128,
    lstm_units: int = 128,
    dropout: float = 0.3
):
    """
    Builds the SOTA Conv1D-BiLSTM Hybrid Model for normalized PSL sequences:
      1. 1D Convolutional Front-End: extracts local temporal motion dynamics and finger transitions.
      2. Deep Bidirectional LSTM: captures sequence-level phonological structure across time.
      3. Regularized Dense Head: outputs softmax probabilities over PSL gloss classes.
    """
    if not TF_AVAILABLE:
        raise ImportError("TensorFlow is required to build this model. Run: pip install tensorflow")

    model = models.Sequential([
        layers.Input(shape=(seq_len, feature_dim)),
        layers.Conv1D(conv_filters, kernel_size=3, padding='same', activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(dropout),
        layers.Bidirectional(layers.LSTM(lstm_units, return_sequences=True)),
        layers.Dropout(dropout),
        layers.Bidirectional(layers.LSTM(lstm_units, return_sequences=False)),
        layers.Dropout(dropout),
        layers.BatchNormalization(),
        layers.Dense(128, activation='relu'),
        layers.Dropout(dropout),
        layers.Dense(num_classes, activation='softmax')
    ])

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss='categorical_crossentropy',
        metrics=['accuracy', tf.keras.metrics.TopKCategoricalAccuracy(k=3, name='top3_acc')]
    )
    return model

