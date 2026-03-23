#!/usr/bin/env python3
"""
OpSecForge Tool Inventory Validator
Validates tool inventory against schema and checks directory structure.
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Any

REPO_ROOT = Path(__file__).parent.parent.parent
INVENTORY_PATH = REPO_ROOT / "data" / "tools" / "inventory.json"
SCHEMA_PATH = REPO_ROOT / "data" / "schemas" / "tool-schema.json"


def load_json(path: Path) -> Dict:
    with open(path, 'r') as f:
        return json.load(f)


def validate_schema(inventory: Dict) -> List[str]:
    """Basic schema validation"""
    errors = []
    
    required_fields = ['version', 'lastUpdated', 'tools']
    for field in required_fields:
        if field not in inventory:
            errors.append(f"Missing required field: {field}")
    
    if 'tools' in inventory:
        for i, tool in enumerate(inventory['tools']):
            tool_errors = validate_tool(tool, i)
            errors.extend(tool_errors)
    
    return errors


def validate_tool(tool: Dict, index: int) -> List[str]:
    """Validate a single tool entry"""
    errors = []
    prefix = f"Tool[{index}]"
    
    required = ['id', 'name', 'category', 'status', 'path']
    for field in required:
        if field not in tool:
            errors.append(f"{prefix}: Missing required field: {field}")
    
    if 'status' in tool:
        valid_statuses = ['production', 'beta', 'planned', 'deprecated']
        if tool['status'] not in valid_statuses:
            errors.append(f"{prefix}: Invalid status '{tool['status']}'")
    
    if 'category' in tool:
        valid_categories = ['security', 'developer', 'utility', 'seo']
        if tool['category'] not in valid_categories:
            errors.append(f"{prefix}: Invalid category '{tool['category']}'")
    
    return errors


def validate_directories(inventory: Dict) -> List[str]:
    """Check that all production tool paths exist"""
    errors = []
    warnings = []
    
    for tool in inventory.get('tools', []):
        tool_path = REPO_ROOT / tool['path']
        status = tool.get('status', 'unknown')
        
        if not tool_path.exists():
            if status in ['production', 'beta']:
                errors.append(f"Tool '{tool['id']}' [{status}]: Directory not found: {tool['path']}")
            else:
                warnings.append(f"Tool '{tool['id']}' [{status}]: Directory not found (expected): {tool['path']}")
        else:
            page_file = tool_path / "page.tsx"
            if not page_file.exists() and status in ['production', 'beta']:
                errors.append(f"Tool '{tool['id']}': Missing page.tsx in {tool['path']}")
    
    if warnings:
        print("\n⚠️  Planned/deprecated tools without directories:")
        for w in warnings:
            print(f"    {w}")
    
    return errors


def main():
    print("🔍 OpSecForge Tool Inventory Validator")
    print("=" * 50)
    
    # Load inventory
    try:
        inventory = load_json(INVENTORY_PATH)
        print(f"✓ Loaded inventory: {INVENTORY_PATH}")
    except FileNotFoundError:
        print(f"✗ Inventory not found: {INVENTORY_PATH}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"✗ Invalid JSON in inventory: {e}")
        sys.exit(1)
    
    # Validate schema
    print("\n📋 Schema Validation...")
    schema_errors = validate_schema(inventory)
    if schema_errors:
        print("✗ Schema validation failed:")
        for err in schema_errors:
            print(f"  - {err}")
    else:
        print("✓ Schema validation passed")
    
    # Validate directories
    print("\n📁 Directory Validation...")
    dir_errors = validate_directories(inventory)
    if dir_errors:
        print("✗ Directory validation failed:")
        for err in dir_errors:
            print(f"  - {err}")
    else:
        print("✓ All tool directories exist with page.tsx")
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Summary:")
    print(f"  Total tools: {inventory['stats']['total']}")
    print(f"  Production: {inventory['stats']['production']}")
    print(f"  Planned: {inventory['stats']['planned']}")
    
    if schema_errors or dir_errors:
        print("\n❌ Validation FAILED")
        sys.exit(1)
    else:
        print("\n✅ All validations PASSED")
        sys.exit(0)


if __name__ == "__main__":
    main()
