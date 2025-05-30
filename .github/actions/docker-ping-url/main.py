import requests
import time
import os

# declare a function
def ping_url(url, delay, max_trials):
    trial = 0

    while (trial < max_trials):
        result = requests.get(url)

        if(result.status_code == 200):
            return True
        else:
            time.sleep(delay)
            trial = trial+1
    
    return False


def run():
    # Get action.yaml inputs from environment variables
    url = os.environ['INPUT_URL']
    delay = int(os.environ['INPUT_DELAY'])
    max_trials = int(os.environ['INPUT_MAX_TRIALS'])

    print("Start ping url '{url}' with max trials '{max_trials}' and a delay of '{delay}' between trials.")

    result = ping_url(url, delay, max_trials)

    if(result == False):
        raise ValueError("Impossible to ping url '{url}' after {max_trials} trials!")


if __name__ == "__main__":
    run()
        