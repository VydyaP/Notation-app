import requests
import sys
import json
from datetime import datetime

class KeerthanaAPITester:
    def __init__(self, base_url="https://9655ef1b-08ab-4c61-9855-9b7ee8f194a3.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_keerthana_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}" if endpoint else self.base_url
        headers = {'Content-Type': 'application/json'} if not files else {}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                    elif isinstance(response_data, dict):
                        print(f"   Response keys: {list(response_data.keys())}")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")

            return success, response.json() if response.content else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        return self.run_test("Root API Endpoint", "GET", "", 200)

    def test_get_keerthanas(self):
        """Test getting all keerthanas"""
        success, response = self.run_test("Get All Keerthanas", "GET", "keerthanas", 200)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} keerthanas")
            if len(response) > 0:
                print(f"   Sample keerthana: {response[0].get('name', 'Unknown')}")
        return success, response

    def test_get_classifications(self):
        """Test getting classifications"""
        success, response = self.run_test("Get Classifications", "GET", "classifications", 200)
        if success:
            print(f"   Ragas: {len(response.get('ragas', []))}")
            print(f"   Talas: {len(response.get('talas', []))}")
            print(f"   Composers: {len(response.get('composers', []))}")
            print(f"   Deities: {len(response.get('deities', []))}")
        return success, response

    def test_create_keerthana(self):
        """Test creating a new keerthana"""
        test_keerthana = {
            "name": f"Test Keerthana {datetime.now().strftime('%H%M%S')}",
            "raga": "Test Raga",
            "tala": "Test Tala",
            "composer": "Test Composer",
            "deity": "Test Deity",
            "date_taught": "2024-07-15",
            "lyrics": "Test lyrics for the keerthana",
            "meaning": "Test meaning of the keerthana"
        }
        
        success, response = self.run_test("Create Keerthana", "POST", "keerthanas", 200, data=test_keerthana)
        if success and 'id' in response:
            self.created_keerthana_id = response['id']
            print(f"   Created keerthana with ID: {self.created_keerthana_id}")
        return success, response

    def test_get_single_keerthana(self):
        """Test getting a single keerthana by ID"""
        if not self.created_keerthana_id:
            print("❌ Skipping - No keerthana ID available")
            return False, {}
        
        return self.run_test("Get Single Keerthana", "GET", f"keerthanas/{self.created_keerthana_id}", 200)

    def test_update_keerthana(self):
        """Test updating a keerthana"""
        if not self.created_keerthana_id:
            print("❌ Skipping - No keerthana ID available")
            return False, {}
        
        update_data = {
            "meaning": "Updated meaning for test keerthana"
        }
        
        return self.run_test("Update Keerthana", "PUT", f"keerthanas/{self.created_keerthana_id}", 200, data=update_data)

    def test_classification_filters(self, classifications):
        """Test classification filter endpoints"""
        results = []
        
        if classifications.get('ragas'):
            test_raga = classifications['ragas'][0]
            success, _ = self.run_test(f"Filter by Raga ({test_raga})", "GET", f"keerthanas/by-raga/{test_raga}", 200)
            results.append(success)
        
        if classifications.get('talas'):
            test_tala = classifications['talas'][0]
            success, _ = self.run_test(f"Filter by Tala ({test_tala})", "GET", f"keerthanas/by-tala/{test_tala}", 200)
            results.append(success)
        
        if classifications.get('composers'):
            test_composer = classifications['composers'][0]
            success, _ = self.run_test(f"Filter by Composer ({test_composer})", "GET", f"keerthanas/by-composer/{test_composer}", 200)
            results.append(success)
        
        if classifications.get('deities'):
            test_deity = classifications['deities'][0]
            success, _ = self.run_test(f"Filter by Deity ({test_deity})", "GET", f"keerthanas/by-deity/{test_deity}", 200)
            results.append(success)
        
        return all(results)

    def test_seed_data(self):
        """Test seeding sample data"""
        return self.run_test("Seed Sample Data", "POST", "seed-data", 200)

    def test_delete_keerthana(self):
        """Test deleting a keerthana"""
        if not self.created_keerthana_id:
            print("❌ Skipping - No keerthana ID available")
            return False, {}
        
        return self.run_test("Delete Keerthana", "DELETE", f"keerthanas/{self.created_keerthana_id}", 200)

def main():
    print("🎵 Starting Keerthana Management API Tests")
    print("=" * 50)
    
    tester = KeerthanaAPITester()
    
    # Test basic endpoints
    tester.test_root_endpoint()
    
    # Seed data first to ensure we have test data
    tester.test_seed_data()
    
    # Test getting data
    success, keerthanas = tester.test_get_keerthanas()
    success, classifications = tester.test_get_classifications()
    
    # Test classification filters
    if classifications:
        tester.test_classification_filters(classifications)
    
    # Test CRUD operations
    tester.test_create_keerthana()
    tester.test_get_single_keerthana()
    tester.test_update_keerthana()
    tester.test_delete_keerthana()
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed! Backend API is working correctly.")
        return 0
    else:
        print("⚠️  Some tests failed. Check the output above for details.")
        return 1

if __name__ == "__main__":
    sys.exit(main())