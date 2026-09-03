use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex, OnceLock};

fn registry() -> &'static Mutex<HashMap<String, Arc<AtomicBool>>> {
    static REGISTRY: OnceLock<Mutex<HashMap<String, Arc<AtomicBool>>>> = OnceLock::new();
    REGISTRY.get_or_init(|| Mutex::new(HashMap::new()))
}

pub fn register(task_id: &str) -> Arc<AtomicBool> {
    let flag = Arc::new(AtomicBool::new(false));
    let mut map = registry().lock().expect("zip cancel lock");
    if let Some(previous) = map.insert(task_id.to_string(), flag.clone()) {
        previous.store(true, Ordering::SeqCst);
    }
    flag
}

pub fn cancel(task_id: &str) -> bool {
    if let Some(flag) = registry().lock().expect("zip cancel lock").get(task_id) {
        flag.store(true, Ordering::SeqCst);
        return true;
    }
    false
}

pub fn unregister(task_id: &str) {
    registry().lock().expect("zip cancel lock").remove(task_id);
}
