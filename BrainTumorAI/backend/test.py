import json
import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications.vgg16 import preprocess_input

# ---------------- CONFIG ----------------
IMG_SIZE = 128
BATCH_SIZE = 32
EVAL_SAMPLES_PER_CLASS = 80

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ARCHIVE_ROOT = os.path.join(BASE_DIR, "archive")
DATASET_ROOT_FALLBACK = os.path.join(BASE_DIR, "dataset")
DATASET_ROOT = ARCHIVE_ROOT if os.path.isdir(ARCHIVE_ROOT) else DATASET_ROOT_FALLBACK

TEST_DIR = os.path.join(DATASET_ROOT, "testing")

MODEL_DIR = os.path.join(BASE_DIR, "model")
MODEL_PATH = os.path.join(MODEL_DIR, "brain_tumor_model.h5")
CLASS_NAMES_PATH = os.path.join(MODEL_DIR, "class_names.json")
CONFUSION_MATRIX_PATH = os.path.join(MODEL_DIR, "confusion_matrix.json")
METRICS_PATH = os.path.join(MODEL_DIR, "metrics.json")
HEATMAP_PATH = os.path.join(MODEL_DIR, "confusion_matrix_heatmap.png")


def list_subfolders(path):
    if not os.path.isdir(path):
        return []
    return sorted(
        [
            name
            for name in os.listdir(path)
            if os.path.isdir(os.path.join(path, name)) and not name.startswith(".")
        ]
    )


def compute_confusion_matrix(y_true, y_pred, num_classes):
    cm = np.zeros((num_classes, num_classes), dtype=np.int64)
    for t, p in zip(y_true, y_pred):
        cm[int(t), int(p)] += 1
    return cm


def compute_metrics_from_confusion_matrix(cm):
    tp = np.diag(cm).astype(np.float64)
    fp = cm.sum(axis=0).astype(np.float64) - tp
    fn = cm.sum(axis=1).astype(np.float64) - tp
    support = cm.sum(axis=1).astype(np.float64)

    precision_per_class = np.divide(tp, tp + fp, out=np.zeros_like(tp), where=(tp + fp) != 0)
    recall_per_class = np.divide(tp, tp + fn, out=np.zeros_like(tp), where=(tp + fn) != 0)
    f1_per_class = np.divide(
        2 * precision_per_class * recall_per_class,
        precision_per_class + recall_per_class,
        out=np.zeros_like(tp),
        where=(precision_per_class + recall_per_class) != 0,
    )

    total = cm.sum()
    accuracy = float(tp.sum() / total) if total > 0 else 0.0

    macro_precision = float(np.mean(precision_per_class))
    macro_recall = float(np.mean(recall_per_class))
    macro_f1 = float(np.mean(f1_per_class))

    support_sum = support.sum()
    if support_sum > 0:
        weighted_precision = float(np.sum(precision_per_class * support) / support_sum)
        weighted_recall = float(np.sum(recall_per_class * support) / support_sum)
        weighted_f1 = float(np.sum(f1_per_class * support) / support_sum)
    else:
        weighted_precision = 0.0
        weighted_recall = 0.0
        weighted_f1 = 0.0

    return {
        "accuracy": accuracy,
        "precision_macro": macro_precision,
        "recall_macro": macro_recall,
        "f1_macro": macro_f1,
        "precision_weighted": weighted_precision,
        "recall_weighted": weighted_recall,
        "f1_weighted": weighted_f1,
        "precision_per_class": precision_per_class.tolist(),
        "recall_per_class": recall_per_class.tolist(),
        "f1_per_class": f1_per_class.tolist(),
        "support_per_class": support.astype(int).tolist(),
    }


def select_first_n_per_class(y_true, n_per_class, num_classes):
    selected_indices = []
    counts = np.zeros(num_classes, dtype=np.int64)

    for idx, cls in enumerate(y_true):
        cls_idx = int(cls)
        if counts[cls_idx] < n_per_class:
            selected_indices.append(idx)
            counts[cls_idx] += 1
        if np.all(counts >= n_per_class):
            break

    return np.array(selected_indices, dtype=np.int64), counts


def format_decimal(value, digits=6):
    return f"{float(value):.{digits}f}"


def print_table(title, headers, rows):
    str_rows = [[str(cell) for cell in row] for row in rows]
    widths = [len(str(h)) for h in headers]
    for row in str_rows:
        for i, cell in enumerate(row):
            widths[i] = max(widths[i], len(cell))

    sep = "+" + "+".join("-" * (w + 2) for w in widths) + "+"
    header_line = "| " + " | ".join(str(headers[i]).ljust(widths[i]) for i in range(len(headers))) + " |"

    print(f"\n{title}")
    print(sep)
    print(header_line)
    print(sep)
    for row in str_rows:
        print("| " + " | ".join(row[i].ljust(widths[i]) for i in range(len(row))) + " |")
    print(sep)


def save_confusion_matrix_heatmap(cm, class_names, output_path):
    try:
        import matplotlib.pyplot as plt
    except ImportError:
        print("\nHeatmap skipped: matplotlib is not installed.")
        print("Install with: pip install matplotlib")
        return

    fig, ax = plt.subplots(figsize=(8, 6))
    im = ax.imshow(cm, cmap="Blues")
    ax.set_title("Confusion Matrix")
    ax.set_xlabel("Predicted")
    ax.set_ylabel("Actual")
    ax.set_xticks(np.arange(len(class_names)))
    ax.set_yticks(np.arange(len(class_names)))
    ax.set_xticklabels(class_names, rotation=45, ha="right")
    ax.set_yticklabels(class_names)

    max_val = int(np.max(cm)) if cm.size else 0
    threshold = max_val / 2.0 if max_val > 0 else 0
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            val = int(cm[i, j])
            color = "white" if val > threshold else "black"
            ax.text(j, i, str(val), ha="center", va="center", color=color, fontsize=10)

    fig.colorbar(im, ax=ax)
    fig.tight_layout()
    fig.savefig(output_path, dpi=200, bbox_inches="tight")
    print(f"\nSaved confusion matrix heatmap: {output_path}")
    plt.close(fig)


def load_class_names():
    if os.path.exists(CLASS_NAMES_PATH):
        with open(CLASS_NAMES_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return list_subfolders(TEST_DIR)


def main():
    if not os.path.isdir(TEST_DIR):
        raise FileNotFoundError(f"Testing folder not found: {TEST_DIR}")
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")

    class_dirs = load_class_names()
    if not class_dirs:
        raise ValueError("No class folders/class names found for evaluation.")

    model = tf.keras.models.load_model(MODEL_PATH, compile=False)
    img_size = int(model.input_shape[1]) if model.input_shape and model.input_shape[1] else IMG_SIZE

    datagen = ImageDataGenerator(preprocessing_function=preprocess_input)
    test_data = datagen.flow_from_directory(
        TEST_DIR,
        classes=class_dirs,
        target_size=(img_size, img_size),
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        shuffle=False,
    )

    num_classes = test_data.num_classes
    print("Testing classes:", class_dirs)
    print("Class indices:", test_data.class_indices)

    pred_probs = model.predict(test_data, verbose=0)
    y_pred_all = np.argmax(pred_probs, axis=1)
    y_true_all = test_data.classes

    available_per_class = np.bincount(y_true_all, minlength=num_classes)
    insufficient_classes = [
        class_dirs[i] for i, count in enumerate(available_per_class) if count < EVAL_SAMPLES_PER_CLASS
    ]
    if insufficient_classes:
        raise ValueError(
            "Not enough test images for first-N-per-class evaluation. "
            f"Need {EVAL_SAMPLES_PER_CLASS} per class. "
            f"Insufficient classes: {insufficient_classes}. "
            f"Available counts: {available_per_class.tolist()}"
        )

    selected_indices, selected_counts = select_first_n_per_class(
        y_true_all, EVAL_SAMPLES_PER_CLASS, num_classes
    )
    expected_samples = EVAL_SAMPLES_PER_CLASS * num_classes
    if selected_indices.size != expected_samples:
        raise RuntimeError(
            f"Selected {selected_indices.size} samples, expected {expected_samples}. "
            f"Counts: {selected_counts.tolist()}"
        )

    y_true = y_true_all[selected_indices]
    y_pred = y_pred_all[selected_indices]

    cm = compute_confusion_matrix(y_true, y_pred, num_classes)
    metrics = compute_metrics_from_confusion_matrix(cm)

    evaluation_payload = {
        "subset": "first_n_per_class_from_testing",
        "n_per_class": EVAL_SAMPLES_PER_CLASS,
        "total_samples": int(selected_indices.size),
        "counts_per_class": selected_counts.astype(int).tolist(),
    }

    cm_headers = ["Actual \\ Pred"] + class_dirs
    cm_rows = []
    for i, cls in enumerate(class_dirs):
        cm_rows.append([cls] + cm[i].tolist())
    print_table(
        f"Confusion Matrix (first {EVAL_SAMPLES_PER_CLASS} images/class from testing)",
        cm_headers,
        cm_rows,
    )

    summary_headers = ["Metric", "Value"]
    summary_rows = [
        ["Accuracy", format_decimal(metrics["accuracy"])],
        ["Precision", format_decimal(metrics["precision_weighted"])],
        ["Recall", format_decimal(metrics["recall_weighted"])],
        ["F1 Score", format_decimal(metrics["f1_weighted"])],
    ]
    print_table("Summary Metrics", summary_headers, summary_rows)

    per_class_headers = ["Class", "Precision", "Recall", "F1 Score", "Support"]
    per_class_rows = []
    for i, cls in enumerate(class_dirs):
        per_class_rows.append(
            [
                cls,
                format_decimal(metrics["precision_per_class"][i]),
                format_decimal(metrics["recall_per_class"][i]),
                format_decimal(metrics["f1_per_class"][i]),
                metrics["support_per_class"][i],
            ]
        )
    print_table("Per-Class Metrics", per_class_headers, per_class_rows)

    os.makedirs(MODEL_DIR, exist_ok=True)
    with open(CONFUSION_MATRIX_PATH, "w", encoding="utf-8") as f:
        json.dump(
            {
                "classes": class_dirs,
                "evaluation": evaluation_payload,
                "matrix": cm.tolist(),
            },
            f,
            indent=2,
        )

    metrics_payload = {
        "classes": class_dirs,
        "dataset_root": DATASET_ROOT,
        "evaluation": evaluation_payload,
        "accuracy": metrics["accuracy"],
        "precision": metrics["precision_weighted"],
        "recall": metrics["recall_weighted"],
        "f1_score": metrics["f1_weighted"],
        **metrics,
    }

    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics_payload, f, indent=2)

    save_confusion_matrix_heatmap(cm, class_dirs, HEATMAP_PATH)
    if os.name == "nt" and os.path.exists(HEATMAP_PATH):
        try:
            os.startfile(HEATMAP_PATH)
        except Exception as e:
            print(f"Could not auto-open confusion matrix heatmap: {e}")
    print(f"\nSaved confusion matrix JSON: {CONFUSION_MATRIX_PATH}")
    print(f"Saved metrics JSON: {METRICS_PATH}")


if __name__ == "__main__":
    main()
