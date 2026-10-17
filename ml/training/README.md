# Pakistani Sign Language (PSL) — SOTA ML Training Pipeline

This directory contains the production-grade training notebook and model definitions for Pakistani Sign Language (PSL) recognition.

---

## 🚀 Unified SOTA Training: `WLPSL_Training_Kaggle.ipynb`

To train the sign recognition model with zero data leakage and high generalization accuracy on unseen videos:

1. **Open on Kaggle or Google Colab (GPU)**:
   - Upload `WLPSL_Training_Kaggle.ipynb` to Kaggle or Google Colab.
   - Attach the Dynamic Word-Level Pakistani Sign Language (WLPSL) dataset containing the 31 sign classes.

2. **The 4 SOTA Engineering Upgrades Included**:
   - **Wrist-Centric Normalization**: Hand joints normalized relative to wrist ($P_{\text{finger}} - P_{\text{wrist}}$) for 100% position invariance.
   - **Torso-Centric Normalization**: Pose landmarks centered at the mid-shoulder point and scaled by shoulder distance.
   - **Dynamic Velocity Vectors**: Frame-to-frame $\Delta P_t = P_t - P_{t-1}$ trajectory dynamics.
   - **Conv1D + BiLSTM Hybrid Architecture**: 1D temporal convolution front-end + deep Bidirectional LSTM.

3. **Validation Protocol**:
   - Strict **pre-split zero-leakage**: 25% of unseen original sign videos are reserved strictly for validation before any temporal or coordinate augmentation is applied.

4. **Export Artifacts**:
   - The notebook trains the model and exports:
     - `wlpsl_lstm.keras`
     - `wlpsl_classes.json`
     - `confusion_matrix.png`
   - Download `wlpsl_lstm.keras` and `wlpsl_classes.json` and place them in `ml/data/processed/`.

---

## ⚡ Deployment & Inference

The backend automatically loads the trained model from `ml/data/processed/` at startup.

- Model Architecture Definition: `ml/models/psl_classifier.py`
- Inference Engine: `ml/inference/psl_recognizer.py`
- Unified 5-Step Pipeline: `backend/app/services/psl_pipeline.py`
- API Router: `POST /api/translate/psl-to-urdu`
