#!/bin/bash
# Script to convert test files from soccer to basketball

TEST_FILES=(
  "lib/__tests__/slugGenerator.test.ts"
  "lib/__tests__/setUtils.test.ts"
)

for file in "${TEST_FILES[@]}"; do
  echo "Processing $file..."

  # Backup original
  cp "/Users/mh/3pt/$file" "/Users/mh/3pt/$file.backup"

  # Replace sport terms
  sed -i '' 's/Soccer/Basketball/g' "/Users/mh/3pt/$file"
  sed -i '' 's/soccer/basketball/g' "/Users/mh/3pt/$file"
  sed -i '' 's/SOCCER/BASKETBALL/g' "/Users/mh/3pt/$file"

  # Replace team names
  sed -i '' 's/USWNT/Lakers/g' "/Users/mh/3pt/$file"
  sed -i '' 's/Barcelona/Celtics/g' "/Users/mh/3pt/$file"
  sed -i '' 's/Man Utd/Warriors/g' "/Users/mh/3pt/$file"
  sed -i '' 's/Manchester United/Warriors/g' "/Users/mh/3pt/$file"
  sed -i '' 's/Real Madrid/Heat/g' "/Users/mh/3pt/$file"
  sed -i '' 's/PSG/Bulls/g' "/Users/mh/3pt/$file"

  # Replace player names
  sed -i '' 's/Messi/LeBron James/g' "/Users/mh/3pt/$file"
  sed -i '' 's/Lionel Messi/LeBron James/g' "/Users/mh/3pt/$file"
  sed -i '' 's/Ronaldo/Stephen Curry/g' "/Users/mh/3pt/$file"
  sed -i '' 's/Cristiano Ronaldo/Stephen Curry/g' "/Users/mh/3pt/$file"
  sed -i '' 's/Neymar/Kevin Durant/g' "/Users/mh/3pt/$file"
  sed -i '' 's/Mbappe/Giannis Antetokounmpo/g' "/Users/mh/3pt/$file"
  sed -i '' 's/Mbappé/Giannis Antetokounmpo/g' "/Users/mh/3pt/$file"
  sed -i '' 's/Salah/Luka Dončić/g' "/Users/mh/3pt/$file"

  # Replace set names
  sed -i '' 's/Road to World Cup/Road to the Finals/g' "/Users/mh/3pt/$file"
  sed -i '' 's/International Stars/All-Stars/g' "/Users/mh/3pt/$file"
  sed -i '' 's/Club Legends/Franchise Legends/g' "/Users/mh/3pt/$file"
  sed -i '' 's/World Cup/NBA Finals/g' "/Users/mh/3pt/$file"

  echo "Done with $file"
done

echo "All test files converted!"
