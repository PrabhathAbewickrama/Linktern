import sys
import json
import pandas as pd
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def recommend_courses(missing_skills_list, target_difficulty):
    data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')
    csv_path = os.path.join(data_dir, 'courses.csv')
    
    if not os.path.exists(csv_path):
        return {"error": "Courses dataset not found."}
        
    df = pd.read_csv(csv_path)
    
    # Filter by difficulty
    filtered_df = df[df['difficulty'].str.lower() == target_difficulty.lower()]
    if filtered_df.empty:
        return {"courses": []}
        
    # Prepare missing skills string
    missing_skills_str = " ".join([str(s).lower() for s in missing_skills_list])
    
    if not missing_skills_str.strip():
        # If no missing skills, return top generic courses for the difficulty
        top_courses = filtered_df.head(3).to_dict('records')
        results = []
        for c in top_courses:
            results.append({
                "name": c['course_name'],
                "skills": c['skills_covered'],
                "difficulty": c['difficulty'],
                "url": c['link'],
                "matchConfidence": 0
            })
        return {"courses": results}
        
    # TF-IDF
    vectorizer = TfidfVectorizer()
    # combine missing skills query with course skills
    corpus = [missing_skills_str] + filtered_df['skills_covered'].tolist()
    
    try:
        tfidf_matrix = vectorizer.fit_transform(corpus)
    except ValueError:
        return {"courses": []}
        
    # Calculate cosine similarity
    similarity_scores = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:])[0]
    
    # Add scores to dataframe
    filtered_df = filtered_df.copy()
    filtered_df['match_score'] = similarity_scores
    
    # Filter out 0 matches and sort
    matched_df = filtered_df[filtered_df['match_score'] > 0.01].sort_values(by='match_score', ascending=False)
    
    if matched_df.empty:
        # If no strict matches, just return valid courses for the path
        matched_df = filtered_df.head(3)
        
    # Get top 3 recommendations
    top_courses = matched_df.head(3).to_dict('records')
    
    # Format appropriately
    results = []
    for c in top_courses:
        results.append({
            "name": c['course_name'],
            "skills": c['skills_covered'],
            "difficulty": c['difficulty'],
            "url": c['link'],
            "matchConfidence": round(float(c.get('match_score', 0) * 100), 1)
        })
        
    return {"courses": results}

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Insufficient arguments"}))
        sys.exit(1)
        
    try:
        missing_skills = json.loads(sys.argv[1])
        difficulty = sys.argv[2]
        
        output = recommend_courses(missing_skills, difficulty)
        print(json.dumps(output))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
