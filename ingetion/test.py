import numpy as np
import random
import matplotlib.pyplot as plt
from collections import defaultdict

class OfficeNavigationEnv:
    def __init__(self):
        # 1. Définir les paramètres de récompense
        self.r_max = 20.0
        self.step_cost = -1.0
        self.max_steps = 20
        
        # 2. Définir les états (les pièces) et les actions possibles (les portes)
        self.state_space = [1, 2, 3, 4, 5, 6, 7]
        self.action_space = ['D0', 'D1', 'D2', 'D3', 'D4', 'D5']
        
        # 3. Définir la topologie du bâtiment (Le vrai modèle de l'environnement)
        self.doors = {
            'D0': {'connects': (1, 2), 'success_rate': 0.7},   # Porte difficile
            'D1': {'connects': (1, 3), 'success_rate': 0.95},  # Porte facile
            'D2': {'connects': (3, 6), 'success_rate': 0.5},   # Très difficile
            'D3': {'connects': (2, 6), 'success_rate': 0.99},  # Très facile
            'D4': {'connects': (3, 4), 'success_rate': 0.8},
            'D5': {'connects': (4, 7), 'success_rate': 0.9}
        }
        
        self.state = None
        self.goal_state = None
        self.steps_taken = 0
    
    def reset(self, start_area=1, goal_area=6):
        """Initialise l'épisode."""
        self.state = start_area
        self.goal_state = goal_area
        self.steps_taken = 0
        return self.state
    
    def step(self, action_door):
        """Exécute l'action de franchir une porte."""
        self.steps_taken += 1
        reward = self.step_cost
        done = False
        
        door = self.doors.get(action_door)
        # Si la porte choisie est bien dans la pièce actuelle
        if door and self.state in door['connects']:
            # Simuler la probabilité de réussir à ouvrir la porte (Stochasticité)
            if random.random() <= door['success_rate']:
                rooms = list(door['connects'])
                rooms.remove(self.state)
                self.state = rooms[0]  # Changement d'état
        
        # Conditions d'arrêt
        if self.state == self.goal_state:
            reward = self.r_max
            done = True
        elif self.steps_taken >= self.max_steps:
            reward = -self.r_max
            done = True
        
        return self.state, reward, done


# EX2
def q_learning_agent(env, episodes=200, alpha=0.1, gamma=0.95, epsilon=0.2):
    """Agent Q-Learning classique."""
    
    # Initialisation de la Q-Table
    q_table = {s: {a: 0.0 for a in env.action_space} for s in env.state_space}
    q_learning_rewards = []
    
    for episode in range(episodes):
        state = env.reset(start_area=1, goal_area=6)
        total_reward = 0
        done = False
        
        while not done:
            # --- Choix de l'action (Epsilon-Greedy) ---
            if random.uniform(0, 1) < epsilon:
                # Exploration : choisir une action aléatoire
                action = random.choice(env.action_space)
            else:
                # Exploitation : choisir la meilleure action connue
                action = max(q_table[state], key=q_table[state].get)
            
            # --- Exécuter l'action dans l'environnement ---
            next_state, reward, done = env.step(action)
            
            # --- Mise à jour Q-Learning (Équation de Bellman) ---
            old_q = q_table[state][action]
            next_max = max(q_table[next_state].values())
            new_q = old_q + alpha * (reward + gamma * next_max - old_q)
            q_table[state][action] = new_q
            
            # Préparation de l'étape suivante
            total_reward += reward
            state = next_state
        
        q_learning_rewards.append(total_reward)
    
    return q_table, q_learning_rewards



# EX3 

def dyna_q_agent(env, episodes=200, alpha=0.1, gamma=0.95, epsilon=0.2, planning_steps=10):
    """Agent Dyna-Q avec apprentissage du modèle et planification."""
    
    # Réinitialiser la Q-Table pour une comparaison juste
    q_table_dyna = {s: {a: 0.0 for a in env.action_space} for s in env.state_space}
    
    # Le Modèle du Monde (Mémoire du robot)
    # Format : model[state][action] = (next_state, reward)
    model = {}
    
    dyna_q_rewards = []
    
    for episode in range(episodes):
        state = env.reset(start_area=1, goal_area=6)
        total_reward = 0
        done = False
        
        while not done:
            # ======= PHASE 1 : Agir et Apprendre =======
            # Choix de l'action (Epsilon-Greedy)
            if random.uniform(0, 1) < epsilon:
                action = random.choice(env.action_space)
            else:
                action = max(q_table_dyna[state], key=q_table_dyna[state].get)
            
            # Exécuter l'action dans l'environnement réel
            next_state, reward, done = env.step(action)
            
            # Mise à jour Q-Learning (Équation de Bellman)
            old_q = q_table_dyna[state][action]
            next_max = max(q_table_dyna[next_state].values())
            new_q = old_q + alpha * (reward + gamma * next_max - old_q)
            q_table_dyna[state][action] = new_q
            
            # ======= PHASE 2 : Apprentissage du Modèle =======
            # Enregistrer ce qui vient de se passer dans la réalité
            if state not in model:
                model[state] = {}
            model[state][action] = (next_state, reward)
            
            # ======= PHASE 3 : Planification (Simulation Mentale) =======
            for _ in range(planning_steps):
                # a) Tirer un état "s_sim" au hasard parmi les états connus dans le 'model'
                if model:  # Vérifier que le modèle n'est pas vide
                    s_sim = random.choice(list(model.keys()))
                    
                    # b) Tirer une action "a_sim" au hasard parmi les actions déjà testées depuis "s_sim"
                    if model[s_sim]:  # Vérifier qu'il y a des actions testées
                        a_sim = random.choice(list(model[s_sim].keys()))
                        
                        # c) Récupérer le (next_state_sim, reward_sim) depuis le 'model'
                        next_state_sim, reward_sim = model[s_sim][a_sim]
                        
                        # d) Faire une mise à jour Q-Learning (Bellman) SIMULÉE sur q_table_dyna
                        old_q_sim = q_table_dyna[s_sim][a_sim]
                        next_max_sim = max(q_table_dyna[next_state_sim].values())
                        new_q_sim = old_q_sim + alpha * (reward_sim + gamma * next_max_sim - old_q_sim)
                        q_table_dyna[s_sim][a_sim] = new_q_sim
            
            # Préparation de l'étape suivante
            total_reward += reward
            state = next_state
        
        dyna_q_rewards.append(total_reward)
    
    return q_table_dyna, dyna_q_rewards

# COMPARAISON

if __name__ == "__main__":
    
    
    # Créer l'environnement
    env = OfficeNavigationEnv()
    
    # Hyperparamètres
    episodes = 200
    alpha = 0.1
    gamma = 0.95
    epsilon = 0.2
    planning_steps = 10
    
    # --- Exercice 2 : Q-Learning Standard ---
    print("\n📊 Entraînement Q-Learning Standard...")
    q_table_ql, q_learning_rewards = q_learning_agent(
        env, episodes=episodes, alpha=alpha, gamma=gamma, epsilon=epsilon
    )
    print(f"✓ Q-Learning terminé : {len(q_learning_rewards)} épisodes")
    
    # --- Exercice 3 : Dyna-Q ---
    print("📊 Entraînement Dyna-Q avec planification...")
    q_table_dyna, dyna_q_rewards = dyna_q_agent(
        env, episodes=episodes, alpha=alpha, gamma=gamma, 
        epsilon=epsilon, planning_steps=planning_steps
    )
    print(f"✓ Dyna-Q terminé : {len(dyna_q_rewards)} épisodes")
    
    # --- Afficher les statistiques ---
    print("\n" + "=" * 70)
    print("STATISTIQUES D'APPRENTISSAGE")
    print("=" * 70)
    print(f"\nQ-Learning:")
    print(f"  • Récompense moyenne (derniers 20 épisodes) : {np.mean(q_learning_rewards[-20:]):.2f}")
    print(f"  • Récompense maximale atteinte : {max(q_learning_rewards):.2f}")
    print(f"  • Épisode où max atteint : {q_learning_rewards.index(max(q_learning_rewards)) + 1}")
    
    print(f"\nDyna-Q (avec {planning_steps} simulations mentales/pas):")
    print(f"  • Récompense moyenne (derniers 20 épisodes) : {np.mean(dyna_q_rewards[-20:]):.2f}")
    print(f"  • Récompense maximale atteinte : {max(dyna_q_rewards):.2f}")
    print(f"  • Épisode où max atteint : {dyna_q_rewards.index(max(dyna_q_rewards)) + 1}")
    
    # --- Analyse comparative ---
    print("\n" + "=" * 70)
    print("ANALYSE COMPARATIVE")
    print("=" * 70)
    
    # Trouver quand Dyna-Q atteint la récompense max
    dyna_max_episode = dyna_q_rewards.index(max(dyna_q_rewards)) + 1
    ql_max_episode = q_learning_rewards.index(max(q_learning_rewards)) + 1
    
    print(f"\n❓ QUESTION : Au bout de combien d'épisodes Dyna-Q atteint-il la récompense max ?")
    print(f"   → Dyna-Q : {dyna_max_episode} épisodes")
    print(f"   → Q-Learning : {ql_max_episode} épisodes")
    print(f"   → Gain : {ql_max_episode - dyna_max_episode} épisodes plus rapide pour Dyna-Q")
    
    # Afficher les Q-Tables (premiers états)
    print("\n" + "=" * 70)
    print("EXEMPLE DE Q-TABLE (État 1)")
    print("=" * 70)
    print("\nQ-Learning:")
    for action in env.action_space:
        print(f"  {action}: {q_table_ql[1][action]:.4f}")
    
    print("\nDyna-Q:")
    for action in env.action_space:
        print(f"  {action}: {q_table_dyna[1][action]:.4f}")
    
    # Plot 3 : Convergence cumulée
    plt.subplot(2, 2, 3)
    ql_cumsum = np.cumsum(q_learning_rewards)
    dyna_cumsum = np.cumsum(dyna_q_rewards)
    plt.plot(ql_cumsum, label='Q-Learning', color='#FF6B6B', linewidth=2)
    plt.plot(dyna_cumsum, label=f'Dyna-Q', color='#4ECDC4', linewidth=2)
    plt.xlabel('Épisode', fontsize=11, fontweight='bold')
    plt.ylabel('Récompense Cumulée', fontsize=11, fontweight='bold')
    plt.title('Récompense Cumulée (Avantage Total)', fontsize=12, fontweight='bold')
    plt.legend(fontsize=10)
    plt.grid(True, alpha=0.3)
    
    # Plot 4 : Distribution des récompenses (histogramme)
    plt.subplot(2, 2, 4)
    plt.hist(q_learning_rewards, bins=20, alpha=0.6, label='Q-Learning', color='#FF6B6B')
    plt.hist(dyna_q_rewards, bins=20, alpha=0.6, label='Dyna-Q', color='#4ECDC4')
    plt.xlabel('Récompense Totale', fontsize=11, fontweight='bold')
    plt.ylabel('Fréquence', fontsize=11, fontweight='bold')
    plt.title('Distribution des Récompenses par Épisode', fontsize=12, fontweight='bold')
    plt.legend(fontsize=10)
    plt.grid(True, alpha=0.3, axis='y')
    
    plt.tight_layout()
    plt.savefig('/home/claude/dyna_q_comparaison.png', dpi=150, bbox_inches='tight')
    print("✓ Graphique sauvegardé : dyna_q_comparaison.png")
    plt.show()
    
    print("\n" + "=" * 70)
    print("RÉFLEXION D'INGÉNIEUR")
    print("=" * 70)
    print("""
    ❓ Pourquoi Dyna-Q est-il critique dans la robotique physique,
       mais peu utilisé pour des jeux vidéo simples ?
    
    🤖 RÉPONSE :
    
    • ROBOTIQUE PHYSIQUE :
      - Coût extrême : chaque mouvement du robot = énergie, usure, temps réel
      - Dyna-Q minimise les étapes physiques réelles
      - Simulations mentales "gratuites" (CPU dans la mémoire du robot)
      - Impact financier énorme (batterie, maintenance)
    
    • JEUX VIDÉO :
      - L'exécution d'une action = gratuite (simulation logicielle)
      - Q-Learning standard suffit (pas de coût de transition)
      - GPU moderne traite des millions de transitions/s
      - Pas de limite d'énergie/batterie
      - Dyna-Q ajoute complexité SANS bénéfice réel
    
    → La clé : Dyna-Q est une optimisation du coût RÉEL de l'exploration.
      Si l'exploration est gratuite, Dyna-Q n'apporte aucun avantage.
    """)