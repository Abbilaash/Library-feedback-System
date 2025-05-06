# setup.py
import os
from transformers import AutoTokenizer, AutoModelForSequenceClassification

def setup_model():
    model_name = "distilbert-base-uncased-finetuned-sst-2-english"
    print("Downloading model and tokenizer...")
    
    # Download and cache the model and tokenizer
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSequenceClassification.from_pretrained(model_name)

    # Save to local directory
    os.makedirs("local_model", exist_ok=True)
    tokenizer.save_pretrained("local_model")
    model.save_pretrained("local_model")
    
    print("Model and tokenizer are saved locally in './local_model'")

if __name__ == "__main__":
    setup_model()
