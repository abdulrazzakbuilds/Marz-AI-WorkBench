// リリースビルドで Windows のコンソールウィンドウを出さない
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs::OpenOptions;
use std::io::Write;

fn main() {
    std::panic::set_hook(Box::new(|panic| {
        let report = std::env::temp_dir().join("marz-ai-workbench-panic.log");
        if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(report) {
            let _ = writeln!(
                file,
                "{panic}\n{}",
                std::backtrace::Backtrace::force_capture()
            );
        }
    }));
    ai_browser_lib::run()
}
