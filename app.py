import streamlit as st
import pandas as pd
import joblib

# Cargar modelo y escalador
model = joblib.load("modelo_knn.pkl")
scaler = joblib.load("scaler.pkl")

st.set_page_config(page_title="Detector de Fraude", layout="centered")

st.title("💳 Detector de Transacciones Fraudulentas")
st.markdown("Completa los detalles de la transacción para predecir si es fraudulenta o no.")

# Formulario de entrada
with st.form("formulario_fraude"):
    step = st.number_input("Step (Tiempo en horas desde el inicio)", min_value=0)
    type_input = st.selectbox("Tipo de transacción", ["TRANSFER", "CASH_OUT"])
    amount = st.number_input("Monto de la transacción ($)", min_value=0.0)
    oldbalanceOrg = st.number_input("Saldo inicial del originante ($)", min_value=0.0)
    newbalanceOrig = st.number_input("Saldo final del originante ($)", min_value=0.0)

    submit = st.form_submit_button("🔍 Verificar transacción")

if submit:
    # Codificar tipo de transacción
    type_encoded = 0 if type_input == "CASH_OUT" else 1

    # Preparar y escalar datos
    input_df = pd.DataFrame([{
        "step": step,
        "type": type_encoded,
        "amount": amount,
        "oldbalanceOrg": oldbalanceOrg,
        "newbalanceOrig": newbalanceOrig
    }])
    input_scaled = scaler.transform(input_df)

    # Predicción
    pred = model.predict(input_scaled)[0]
    prob = model.predict_proba(input_scaled)[0][1]

    # Resultado
    if pred == 1:
        st.error(f"⚠️ ¡Transacción probablemente fraudulenta! (Probabilidad: {prob:.2%})")
    else:
        st.success(f"✅ Transacción legítima. (Probabilidad de fraude: {prob:.2%})")
