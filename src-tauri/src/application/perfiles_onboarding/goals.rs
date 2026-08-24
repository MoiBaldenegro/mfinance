//! REQ-23-03, REQ-23-11: CRUD del journal de metas (goals_journal) del perfil.
use crate::domain::onboarding::GoalEntry;
use crate::domain::perfil::Perfil;
use crate::domain::perfil_errors::PerfilError;
use crate::domain::perfil_repository::PerfilRepository;

/// Agrega una entrada al journal de metas del perfil.
pub fn agregar_goal(
    repo: &mut dyn PerfilRepository,
    perfil_id: &str,
    titulo: String,
    descripcion: String,
    tags: Vec<String>,
) -> Result<GoalEntry, PerfilError> {
    let goal = GoalEntry::nueva(titulo, descripcion, tags)
        .map_err(|e| PerfilError::Persistencia(e.to_string()))?;

    let mut registro = repo.cargar_registro()?.ok_or_else(|| {
        PerfilError::PerfilInexistente(perfil_id.to_string())
    })?;

    let perfil_idx = registro
        .perfiles
        .iter()
        .position(|p| p.id == perfil_id)
        .ok_or_else(|| PerfilError::PerfilInexistente(perfil_id.to_string()))?;

    registro.perfiles[perfil_idx].goals_journal.push(goal.clone());
    repo.guardar_registro(&registro)?;
    Ok(goal)
}

/// Elimina una entrada del journal de metas por su id.
pub fn eliminar_goal(
    repo: &mut dyn PerfilRepository,
    perfil_id: &str,
    goal_id: &str,
) -> Result<(), PerfilError> {
    let mut registro = repo.cargar_registro()?.ok_or_else(|| {
        PerfilError::PerfilInexistente(perfil_id.to_string())
    })?;

    let perfil_idx = registro
        .perfiles
        .iter()
        .position(|p| p.id == perfil_id)
        .ok_or_else(|| PerfilError::PerfilInexistente(perfil_id.to_string()))?;

    let len_antes = registro.perfiles[perfil_idx].goals_journal.len();
    registro.perfiles[perfil_idx].goals_journal.retain(|g| g.id != goal_id);
    if registro.perfiles[perfil_idx].goals_journal.len() == len_antes {
        return Err(PerfilError::Persistencia("meta no encontrada".into()));
    }

    repo.guardar_registro(&registro)?;
    Ok(())
}

/// Actualiza una entrada del journal de metas existente.
pub fn actualizar_goal(
    repo: &mut dyn PerfilRepository,
    perfil_id: &str,
    goal_id: &str,
    titulo: String,
    descripcion: String,
    tags: Vec<String>,
) -> Result<GoalEntry, PerfilError> {
    let nueva = GoalEntry::nueva(titulo, descripcion, tags)
        .map_err(|e| PerfilError::Persistencia(e.to_string()))?;

    let mut registro = repo.cargar_registro()?.ok_or_else(|| {
        PerfilError::PerfilInexistente(perfil_id.to_string())
    })?;

    let perfil_idx = registro
        .perfiles
        .iter()
        .position(|p| p.id == perfil_id)
        .ok_or_else(|| PerfilError::PerfilInexistente(perfil_id.to_string()))?;

    let goal_idx = registro.perfiles[perfil_idx]
        .goals_journal
        .iter()
        .position(|g| g.id == goal_id)
        .ok_or_else(|| PerfilError::Persistencia("meta no encontrada".into()))?;

    // Preservar id y fecha de creación
    let id = registro.perfiles[perfil_idx].goals_journal[goal_idx].id.clone();
    let creado_en = registro.perfiles[perfil_idx].goals_journal[goal_idx].creado_en.clone();
    registro.perfiles[perfil_idx].goals_journal[goal_idx] = GoalEntry {
        id,
        titulo: nueva.titulo,
        descripcion: nueva.descripcion,
        tags: nueva.tags,
        creado_en,
    };

    let goal_actualizado = registro.perfiles[perfil_idx].goals_journal[goal_idx].clone();
    repo.guardar_registro(&registro)?;
    Ok(goal_actualizado)
}