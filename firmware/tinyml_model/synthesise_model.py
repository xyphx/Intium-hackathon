import pandas as pd
import numpy as np
from sklearn.tree import DecisionTreeClassifier
import emlearn

print("Generating Subnet A (Heavy Industrial) dataset...")

# Features: [Temperature, Smoke, Vibration, Water]
# 0: NORMAL (Engine running nominally)
normal = np.column_stack((np.random.normal(60, 5, 500), np.random.normal(5, 1, 500), 
                          np.random.normal(1, 0.2, 500), np.random.normal(0, 0, 500)))
labels_normal = np.zeros(500)

# 1: ENGINE FIRE (Massive heat and smoke spikes)
fire = np.column_stack((np.random.normal(120, 10, 500), np.random.normal(85, 5, 500), 
                        np.random.normal(1, 0.5, 500), np.random.normal(0, 0, 500)))
labels_fire = np.ones(500)

# 2: MECHANICAL CRASH (Extreme vibration/G-force spike)
crash = np.column_stack((np.random.normal(65, 5, 500), np.random.normal(5, 2, 500), 
                         np.random.normal(15, 3, 500), np.random.normal(0, 0, 500)))
labels_crash = np.full(500, 2)

# Combine and train
X = np.vstack((normal, fire, crash))
y = np.concatenate((labels_normal, labels_fire, labels_crash))

model = DecisionTreeClassifier(max_depth=5, random_state=42)
model.fit(X, y)

print("Accuracy:", model.score(X, y))

# Export to pure C
cmodel = emlearn.convert(model, method='inline')
cmodel.save(file='subnet_a_model.h', name='subnet_a_ai')
print("\nSUCCESS: 'subnet_a_model.h' generated. Move this to your ESP-IDF include/ folder.")
