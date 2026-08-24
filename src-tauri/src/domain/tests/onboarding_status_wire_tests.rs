use crate::domain::onboarding::OnboardingStatus;

#[test]
fn serializa_los_tres_estados_en_el_contrato_canonico() {
    let casos = [
        (OnboardingStatus::NotStarted, r#"{"nombre":"NotStarted"}"#),
        (
            OnboardingStatus::InProgress { current_step: 3 },
            r#"{"nombre":"InProgress","current_step":3}"#,
        ),
        (OnboardingStatus::Completed, r#"{"nombre":"Completed"}"#),
    ];

    for (estado, esperado) in casos {
        assert_eq!(serde_json::to_string(&estado).unwrap(), esperado);
    }
}

#[test]
fn deserializa_el_contrato_canonico_y_la_forma_serde_externa_legacy() {
    let casos = [
        (r#"{"nombre":"NotStarted"}"#, OnboardingStatus::NotStarted),
        (r#"{"nombre":"InProgress","current_step":4}"#, OnboardingStatus::InProgress { current_step: 4 }),
        (r#"{"nombre":"Completed"}"#, OnboardingStatus::Completed),
        (r#""NotStarted""#, OnboardingStatus::NotStarted),
        (r#"{"InProgress":{"current_step":4}}"#, OnboardingStatus::InProgress { current_step: 4 }),
        (r#""Completed""#, OnboardingStatus::Completed),
    ];

    for (entrada, esperado) in casos {
        let recibido: OnboardingStatus = serde_json::from_str(entrada).unwrap();
        assert_eq!(recibido, esperado);
    }
}
