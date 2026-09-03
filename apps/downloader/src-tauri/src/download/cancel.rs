use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Mutex, OnceLock};

use tokio_util::sync::CancellationToken;

struct ActiveDownload {
    token: CancellationToken,
    part_path: PathBuf,
}

fn registry() -> &'static Mutex<HashMap<u32, ActiveDownload>> {
    static REGISTRY: OnceLock<Mutex<HashMap<u32, ActiveDownload>>> = OnceLock::new();
    REGISTRY.get_or_init(|| Mutex::new(HashMap::new()))
}

pub fn register(job_id: u32, part_path: PathBuf) -> CancellationToken {
    let token = CancellationToken::new();
    registry()
        .lock()
        .expect("cancel registry lock")
        .insert(
            job_id,
            ActiveDownload {
                token: token.clone(),
                part_path,
            },
        );
    token
}

pub fn cancel(job_id: u32) -> bool {
    if let Some(active) = registry()
        .lock()
        .expect("cancel registry lock")
        .remove(&job_id)
    {
        active.token.cancel();
        return true;
    }
    false
}

pub fn unregister(job_id: u32) {
    registry()
        .lock()
        .expect("cancel registry lock")
        .remove(&job_id);
}

pub fn part_path_for(job_id: u32) -> Option<PathBuf> {
    registry()
        .lock()
        .expect("cancel registry lock")
        .get(&job_id)
        .map(|active| active.part_path.clone())
}
