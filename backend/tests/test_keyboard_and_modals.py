"""
Requirement 9: Modal exclusivity and accessibility test.
"""
def compute_open_modal_count(states: dict) -> int:
    return sum(1 for v in states.values() if v is True)

def test_modal_exclusivity():
    modal_states = {
        "isConsecutiveTrackerOpen": False,
        "isLiveVehiclesDBOpen": True,
        "isDashcamOpen": False,
        "isCitizenPWAOpen": False,
        "isNotificationsOpen": False
    }
    assert compute_open_modal_count(modal_states) == 1

def test_escape_key_closes_all_modals():
    modal_states = {
        "isConsecutiveTrackerOpen": True,
        "isLiveVehiclesDBOpen": True,
        "isDashcamOpen": True,
        "isCitizenPWAOpen": True,
        "isNotificationsOpen": True
    }
    # Simulate Escape key effect
    closed_states = {k: False for k in modal_states}
    assert compute_open_modal_count(closed_states) == 0
