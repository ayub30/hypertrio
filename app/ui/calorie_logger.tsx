'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { RestaurantMenu, Add, Delete } from '@mui/icons-material';
import { useToast } from './use-toast';

interface CalorieEntry {
    id: string;
    food: string;
    calories: number;
    timestamp: Date;
}

export default function CalorieLogger() {
    const { data: session } = useSession();
    const { toast } = useToast();
    const [entries, setEntries] = useState<CalorieEntry[]>([]);
    const [newFood, setNewFood] = useState('');
    const [newCalories, setNewCalories] = useState('');
    const [calorieGoal, setCalorieGoal] = useState(2000);

    useEffect(() => {
        const fetchCalorieGoal = async () => {
            try {
                if (!session?.user?.id) return;
                const response = await fetch(`http://localhost:8000/auth/user/${session.user.id}`);
                if (!response.ok) throw new Error('Failed to fetch user data');
                const data = await response.json();
                if (data.calorie_goal) {
                    setCalorieGoal(data.calorie_goal);
                }
            } catch (error) {
                console.error('Error fetching calorie goal:', error);
            }
        };

        fetchCalorieGoal();
    }, [session]);

    const handleAddEntry = () => {
        if (!newFood || !newCalories) return;

        const newEntry: CalorieEntry = {
            id: Date.now().toString(),
            food: newFood,
            calories: parseInt(newCalories),
            timestamp: new Date()
        };

        setEntries([...entries, newEntry]);
        setNewFood('');
        setNewCalories('');
    };

    const handleDeleteEntry = (id: string) => {
        setEntries(entries.filter(entry => entry.id !== id));
    };

    const handleCalorieGoal = async (calories: number) => {
        if (!session?.user?.id) return;
        
        try {
            const response = await fetch(`http://localhost:8000/auth/user/${session.user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ calorie_goal: calories }),
            });

            if (!response.ok) throw new Error('Failed to update calorie goal');
            
            setCalorieGoal(calories);
            toast({
                title: 'Success',
                description: 'Calorie goal updated',
            });
        } catch (error) {
            console.error('Error updating calorie goal:', error);
            toast({
                title: 'Error',
                description: 'Failed to update calorie goal',
                variant: 'destructive',
            });
        }
    }

    const totalCalories = entries.reduce((sum, entry) => sum + entry.calories, 0);

    return (
        <div className="flex flex-col w-full max-w-3xl mx-auto p-6 gap-6">
            <div className="flex flex-col items-center gap-4">
                <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                    <RestaurantMenu />
                    Calorie Logger
                </h1>
                <div className="stats shadow">
                    <div className="stat">
                        <div className="stat-title">Total Calories Today</div>
                        <div className="stat-value text-primary">{totalCalories}</div>
                        <div className="stat-desc flex items-center gap-2">
                            Target: 
                            <input 
                                type="number" 
                                className="input input-bordered input-sm w-20" 
                                value={calorieGoal} 
                                onChange={(e) => handleCalorieGoal(parseInt(e.target.value))}
                                min="0"
                                step="100"
                            /> 
                            kcal
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-row gap-4">
                <input
                    type="text"
                    placeholder="Food item"
                    className="input input-bordered flex-1 text-base-content"
                    value={newFood}
                    onChange={(e) => setNewFood(e.target.value)}
                />
                <input
                    type="number"
                    placeholder="Calories"
                    className="input input-bordered w-32 text-base-content"
                    value={newCalories}
                    onChange={(e) => setNewCalories(e.target.value)}
                />
                <button 
                    className="btn btn-primary" 
                    onClick={handleAddEntry}
                    disabled={!newFood || !newCalories}
                >
                    <Add />
                    Add
                </button>
            </div>

            <div className="flex flex-col gap-2">
                {entries.length === 0 ? (
                    <div className="text-center text-gray-500 my-8">
                        No entries yet. Add your first meal!
                    </div>
                ) : (
                    entries.map(entry => (
                        <div 
                            key={entry.id} 
                            className="flex items-center justify-between p-4 bg-base-200 rounded-lg"
                        >
                            <div className="flex flex-col">
                                <span className="font-medium">{entry.food}</span>
                                <span className="text-sm text-gray-500">
                                    {entry.timestamp.toLocaleTimeString()}
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-lg font-bold">
                                    {entry.calories} kcal
                                </span>
                                <button 
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => handleDeleteEntry(entry.id)}
                                >
                                    <Delete className="text-error" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
