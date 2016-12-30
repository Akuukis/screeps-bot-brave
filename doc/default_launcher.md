# Main loop

Main loops doesn't cycle through creeps. Here's the order:

1. Global defines
2. (if error) Sanity checks
3. The Colony priority tasks
4. (each) Spawn priority tasks
5. (each) Squad tasks in type order AND their creeps tasks
7. The Colony normal tasks (signup distribution)
6. (each) Spawn normal tasks
8. (if any) deffered tasks given by any entity