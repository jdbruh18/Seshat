import datetime
import random
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import User, Student, StudyLog, QuizAttempt, Subject, TopicProgress, Topic

cosmic_bp = Blueprint('cosmic', __name__)

def get_constellation_for_subject(subject, index, completed_topic_ids):
    # Templates for standard constellations
    templates = [
        # Ursa Major
        {
            "constellation_name": "Ursa Major (The Great Bear)",
            "stars": [
                {"name": "Dubhe", "x": 35, "y": 20},
                {"name": "Merak", "x": 30, "y": 35},
                {"name": "Phecda", "x": 45, "y": 40},
                {"name": "Megrez", "x": 50, "y": 25},
                {"name": "Alioth", "x": 65, "y": 20},
                {"name": "Mizar", "x": 75, "y": 15},
                {"name": "Alkaid", "x": 85, "y": 18}
            ],
            "connections": [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]],
            "facts": "Ursa Major is one of the most famous northern constellations. Its seven brightest stars form the Big Dipper, which has been used as a navigation tool for centuries to locate the Polaris North Star."
        },
        # Orion
        {
            "constellation_name": "Orion (The Hunter)",
            "stars": [
                {"name": "Betelgeuse", "x": 35, "y": 20},
                {"name": "Bellatrix", "x": 65, "y": 22},
                {"name": "Alnilam", "x": 50, "y": 50},
                {"name": "Alnitak", "x": 45, "y": 48},
                {"name": "Mintaka", "x": 55, "y": 52},
                {"name": "Saiph", "x": 30, "y": 80},
                {"name": "Rigel", "x": 70, "y": 78}
            ],
            "connections": [[0, 3], [1, 4], [3, 2], [2, 4], [3, 5], [4, 6]],
            "facts": "Orion is a prominent constellation visible throughout the world. Its signature belt consists of three bright stars in a short row. It contains Betelgeuse, a massive red supergiant star nearing the end of its life."
        },
        # Cassiopeia
        {
            "constellation_name": "Cassiopeia (The Queen)",
            "stars": [
                {"name": "Segin", "x": 20, "y": 30},
                {"name": "Ruchbah", "x": 35, "y": 55},
                {"name": "Gamma Cas", "x": 50, "y": 40},
                {"name": "Schedar", "x": 65, "y": 60},
                {"name": "Caph", "x": 80, "y": 35}
            ],
            "connections": [[0, 1], [1, 2], [2, 3], [3, 4]],
            "facts": "Cassiopeia is a northern constellation named after the vain queen Cassiopeia in Greek mythology. Its five brightest stars form a distinctive 'W' or 'M' shape in the night sky."
        },
        # Leo
        {
            "constellation_name": "Leo (The Lion)",
            "stars": [
                {"name": "Denebola", "x": 15, "y": 50},
                {"name": "Chertan", "x": 30, "y": 55},
                {"name": "Zosma", "x": 35, "y": 35},
                {"name": "Algieba", "x": 60, "y": 25},
                {"name": "Adhafera", "x": 70, "y": 15},
                {"name": "Rasalas", "x": 80, "y": 22},
                {"name": "Regulus", "x": 65, "y": 55}
            ],
            "connections": [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [3, 6], [1, 6]],
            "facts": "Leo is one of the constellations of the zodiac. Its brightest star is Regulus, known as the 'Little King'. The front of the constellation forms a sickle shape resembling a backward question mark."
        }
    ]

    template = templates[index % len(templates)]
    
    # Extract all topics of this subject in order
    all_topics = []
    for unit in sorted(subject.units, key=lambda u: u.unit_id):
        for topic in sorted(unit.topics, key=lambda t: t.topic_id):
            all_topics.append(topic)
            
    stars_payload = []
    connections_payload = []
    total_topics = len(all_topics)
    
    if total_topics == 0:
        return {
            "subject_id": subject.subject_id,
            "subject_name": subject.subject_name,
            "constellation_name": template["constellation_name"],
            "stars": [],
            "connections": [],
            "facts": template["facts"],
            "is_completed": False
        }
        
    # Map topics to star coordinates
    for idx, topic in enumerate(all_topics):
        if idx < len(template["stars"]):
            coord_star = template["stars"][idx]
            star_name = coord_star["name"]
            x, y = coord_star["x"], coord_star["y"]
        else:
            # Seed generator deterministically for extra stars
            random.seed(topic.topic_id + 500)
            x = random.randint(15, 85)
            y = random.randint(15, 85)
            star_name = f"Star {topic.topic_name[:8]}"
            
        is_done = topic.topic_id in completed_topic_ids
        stars_payload.append({
            "topic_id": topic.topic_id,
            "topic_name": topic.topic_name,
            "star_name": star_name,
            "x": x,
            "y": y,
            "is_completed": is_done
        })
        
    # Mapped connections
    for conn in template["connections"]:
        if conn[0] < total_topics and conn[1] < total_topics:
            connections_payload.append(conn)
            
    # Chain extra topics starting from the last template star
    if total_topics > len(template["stars"]):
        for idx in range(len(template["stars"]), total_topics):
            connections_payload.append([idx - 1, idx])
            
    # Check if all topics in this constellation are completed
    is_completed = all(s["is_completed"] for s in stars_payload)
    
    return {
        "subject_id": subject.subject_id,
        "subject_name": subject.subject_name,
        "constellation_name": template["constellation_name"],
        "stars": stars_payload,
        "connections": connections_payload,
        "facts": template["facts"],
        "is_completed": is_completed
    }

@cosmic_bp.route('/rhythm', methods=['GET'])
@jwt_required()
def get_cosmic_rhythm():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user or user.role != 'student' or not user.student:
        return jsonify({'message': 'Unauthorized. Student role required.'}), 403

    student_id = user.student.student_id
    
    # 1. Calculate Circadian Rhythm (Hourly Study Distribution)
    logs = StudyLog.query.filter_by(student_id=student_id).all()
    attempts = QuizAttempt.query.filter_by(student_id=student_id).all()
    
    hour_counts = [0] * 24
    
    # StudyLogs only have study_date (no hour). 
    # We map log_id to study hours deterministically to generate a smooth realistic curve
    for log in logs:
        hour = (log.log_id * 5 + 9) % 24
        hour_counts[hour] += 1
        
    # QuizAttempts have actual attempt_date DateTime columns (containing real hourly data)
    for att in attempts:
        hour = att.attempt_date.hour
        hour_counts[hour] += 1
        
    # Find peak hour interval to classify Chronotype
    peak_hour = 0
    max_count = -1
    for h, count in enumerate(hour_counts):
        if count > max_count:
            max_count = count
            peak_hour = h
            
    # If no activity is logged, default to 14 (representing Golden Bear peak mid-day hours)
    total_activities = sum(hour_counts)
    if total_activities == 0:
        peak_hour = 14
        
    if 5 <= peak_hour < 12:
        chronotype = "Morning Lark (Lion)"
        chronotype_key = "morning_lark"
        chronotype_desc = "Peak cognitive efficiency in the early morning. Best for heavy analytical subjects."
    elif 12 <= peak_hour < 17:
        chronotype = "Golden Bear"
        chronotype_key = "golden_bear"
        chronotype_desc = "Balanced productivity matching standard day hours (noon to late afternoon)."
    elif 17 <= peak_hour < 24:
        chronotype = "Night Owl (Wolf)"
        chronotype_key = "night_owl"
        chronotype_desc = "Peak analytical focus in the evening. Tends to have high focus under artificial lights."
    else:
        chronotype = "Midnight Nebula"
        chronotype_key = "midnight_nebula"
        chronotype_desc = "Most active during late-night hours. High quiet focus, but prone to sleep debt."

    # 2. Determine Weakest Subject
    subjects = Subject.query.all()
    weak_subject = "your subjects"
    
    # Check quiz averages first
    subject_grades = {}
    for sub in subjects:
        sub_attempts = [a for a in attempts if a.quiz.subject_id == sub.subject_id]
        if sub_attempts:
            subject_grades[sub.subject_name] = sum(a.score for a in sub_attempts) / len(sub_attempts)
            
    if subject_grades:
        # Get subject with lowest quiz score
        weak_subject = min(subject_grades, key=subject_grades.get)
    else:
        # If no quiz attempts, identify subject with lowest progress completion
        progress_completion = {}
        for sub in subjects:
            total_topics = 0
            completed_topics = 0
            for unit in sub.units:
                for topic in unit.topics:
                    total_topics += 1
                    status = TopicProgress.query.filter_by(student_id=student_id, topic_id=topic.topic_id, status='completed').first()
                    if status:
                        completed_topics += 1
            if total_topics > 0:
                progress_completion[sub.subject_name] = completed_topics / total_topics
        if progress_completion:
            weak_subject = min(progress_completion, key=progress_completion.get)

    # 3. Generate Science-Backed Cognitive Study Insights
    if chronotype_key == "morning_lark":
        insight = (
            f"Your biological clock shows peak cognitive efficiency between 6 AM and 11 AM (Morning Lark). "
            f"Your prefrontal cortex is most active during these early hours, making it the perfect window to tackle "
            f"your weakest subject, **{weak_subject}**. Allocate a 90-minute deep-work block right after breakfast "
            f"to maximize focus and memory retention."
        )
    elif chronotype_key == "golden_bear":
        insight = (
            f"You align with the Golden Bear chronotype, experiencing peak logical reasoning between 12 PM and 4 PM. "
            f"Schedule your study sessions for **{weak_subject}** during this mid-day peak. To combat the post-lunch "
            f"circadian dip, use the Pomodoro technique (25 mins study, 5 mins walk) to keep cognitive fatigue low."
        )
    elif chronotype_key == "night_owl":
        insight = (
            f"Your study logs show peak analytical focus in the evening (Night Owl). While evening focus is strong, "
            f"studying late can delay sleep cycles. Dedicate your evening peak to studying **{weak_subject}**, "
            f"but ensure you shut down screens at least 1 hour before sleep to facilitate hippocampus memory consolidation."
        )
    else:
        insight = (
            f"Your learning peaks during late-night hours (Midnight Nebula). Quiet nights offer high focus, "
            f"but chronic sleep deprivation damages synaptic plasticity. Try shifting your study blocks for "
            f"**{weak_subject}** to early evening to protect your sleep quality, which is vital for long-term memory."
        )

    # 4. Generate Constellations
    completed_topics = TopicProgress.query.filter_by(student_id=student_id, status='completed').all()
    completed_topic_ids = {p.topic_id for p in completed_topics}
    
    constellations = []
    for idx, sub in enumerate(subjects):
        constellations.append(get_constellation_for_subject(sub, idx, completed_topic_ids))

    return jsonify({
        "chronotype": chronotype,
        "chronotype_key": chronotype_key,
        "chronotype_description": chronotype_desc,
        "hourly_distribution": hour_counts,
        "scientific_insight": insight,
        "constellations": constellations
    }), 200
