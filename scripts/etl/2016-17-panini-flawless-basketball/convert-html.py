#!/usr/bin/env python3
"""
Convert HTML table checklist to CSV for 2016-17 Panini Flawless Basketball
"""
import pandas as pd
from io import StringIO
import os

# Input and output paths
INPUT_FILE = '/Users/mh/Desktop/2016-17 Panini Flawless Basketball/2016-17-Panini-Flawless-NBA-Checklist.xls'
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(OUTPUT_DIR, 'flawless-checklist.csv')

def main():
    print(f"Reading HTML file: {INPUT_FILE}")

    # Read HTML file
    with open(INPUT_FILE, 'r') as f:
        html = f.read()

    # Parse HTML table
    dfs = pd.read_html(StringIO(html))
    df = dfs[0]

    # Set proper column names from first row
    df.columns = df.iloc[0]
    df = df[1:]  # Remove header row

    # Rename columns for clarity
    df = df.rename(columns={
        'Card Set': 'set_name',
        'Number': 'card_number',
        'Player': 'player_name',
        'Team': 'team',
        'Seq.': 'seq'
    })

    # Clean up data
    df['player_name'] = df['player_name'].str.strip()
    df['team'] = df['team'].str.strip()
    df['set_name'] = df['set_name'].str.strip()
    df['card_number'] = df['card_number'].astype(str).str.strip()

    # Drop the seq column (it's empty)
    df = df.drop(columns=['seq'])

    # Save to CSV
    df.to_csv(OUTPUT_FILE, index=False)

    print(f"Saved {len(df)} rows to: {OUTPUT_FILE}")
    print(f"\nUnique sets: {df['set_name'].nunique()}")
    print("\nSet counts:")
    for name, count in df['set_name'].value_counts().sort_index().items():
        print(f"  {name}: {count}")

if __name__ == '__main__':
    main()
