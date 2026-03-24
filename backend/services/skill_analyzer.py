import numpy as np
import pandas as pd
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class SkillAnalyzer:
    def __init__(self, data_dir=None):
        if data_dir is None:
            data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')
        self.data_dir = data_dir
        self.role_requirements = self._load_role_requirements()

    def _load_role_requirements(self):
        """Load role requirements from CSV file."""
        csv_path = os.path.join(self.data_dir, 'role_requirements.csv')
        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"Role requirements CSV not found at {csv_path}")

        df = pd.read_csv(csv_path)
        requirements = {}
        for role in df['role'].unique():
            role_df = df[df['role'] == role]
            requirements[role] = {
                'required': role_df[role_df['type'] == 'required']['skill'].tolist(),
                'preferred': role_df[role_df['type'] == 'preferred']['skill'].tolist()
            }
        return requirements

    def _normalize_skills(self, skills_list):
        if isinstance(skills_list, str):
            skills_list = [s.strip() for s in skills_list.split(',')]

        normalized = []
        for s in skills_list:
            clean = s.strip().lower()
            if clean and clean not in normalized:
                normalized.append(clean)
        return ' '.join(normalized), normalized

    def analyze_gap(self, student_skills_input, target_role):
        if target_role not in self.role_requirements:
            raise ValueError(f"Role '{target_role}' not found in database.")

        reqs = self.role_requirements[target_role]
        all_required = reqs["required"]
        all_preferred = reqs["preferred"]

        # Combine required and preferred for the "Job Document"
        job_skills_str = ' '.join(all_required + all_preferred)

        # Process Student Skills
        student_skills_str, student_skills_list = self._normalize_skills(student_skills_input)

        if not student_skills_str:
            raise ValueError("Student skills cannot be empty.")

        # 1. TF-IDF Vectorization
        vectorizer = TfidfVectorizer()
        corpus = [job_skills_str, student_skills_str]

        try:
            tfidf_matrix = vectorizer.fit_transform(corpus)
        except ValueError:
            return {
                "match_percentage": 0.0,
                "suitability_level": "Low",
                "missing_skills": all_required,
                "ai_recommendation": "Your skills don't match the required skills for this role. Consider learning the core requirements.",
                "confidence_score": 0.99
            }

        # 2. Compute Cosine Similarity
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        match_percentage = round(float(similarity * 100), 1)

        # 3. Classify Suitability
        if match_percentage >= 75:
            suitability = "High"
        elif match_percentage >= 50:
            suitability = "Moderate"
        else:
            suitability = "Low"

        # 4. Detect Missing Skills
        missing_skills = [skill for skill in all_required if skill not in student_skills_list]

        # 5. Generate Dynamic AI Recommendation
        if suitability == "High":
            base_rec = "You are strongly aligned for this role."
            if missing_skills:
                rec = f"{base_rec} Learning {', '.join(missing_skills[:2])} can further increase your competitiveness."
            else:
                rec = f"{base_rec} You have an excellent foundational skill set."
        elif suitability == "Moderate":
            rec = f"You have decent alignment, but there are critical gaps. Immediate upskilling in {', '.join(missing_skills[:2])} is recommended."
        else:
            rec = f"You have a low skill match. Focus heavily on acquiring foundational skills like {', '.join(missing_skills[:3])}."

        # Confidence score
        confidence = min(1.0, 0.6 + (len(student_skills_list) * 0.05))

        return {
            "match_percentage": match_percentage,
            "suitability_level": suitability,
            "missing_skills": missing_skills,
            "ai_recommendation": rec,
            "confidence_score": round(confidence, 2)
        }
