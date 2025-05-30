import requests
import time
import os

# declare a function
def ping_url(url, delay, max_trials):
    trial = 0

    if(max_trials > 20 or max_trials <= 0):
        raise ValueError(f"Max trials (value: {max_trials}) is too high or too low. Please provide a value greater than 0 and lower than 20.")

    if(delay < 1 or delay > 60):
        raise ValueError(f"delay (value: {delay} sec) is too high or too low. Please provide a value greater than 0 and lower than 60.")

    while (trial < max_trials):
        try:
            response = requests.get(url)
            if(response.status_code == 200):
                print(f"Url '{url}' is reachable.")
                return True
        except requests.ConnectionError:
            print(f"Url '{url}' is not reachable. Retry in {delay} second.")
            time.sleep(delay)
            trial += 1
        except requests.exceptions.MissingSchema:
            print(f"Invalid Url format: {url}. Make sure the Url has a valid schema: (e.g., https:// or http://).")
            return False

    return False


def run():
    # Get action.yaml inputs from environment variables
    url = os.getenv('INPUT_URL')
    delay = int(os.getenv('INPUT_DELAY'))
    max_trials = int(os.getenv('INPUT_MAX_TRIALS'))

    # f allow to insert variable into a const string
    print(f"Start ping url '{url}' with max trials '{max_trials}' and a delay of '{delay}' between trials.")

    succeed = ping_url(url, delay, max_trials)
    
    # write outputs
    outputFile = open(os.getenv('GITHUB_OUTPUT'), 'a')
    print(f'url-reachable={succeed}', file=outputFile)

    if(succeed == False):
        raise Exception(f"Impossible to reach url '{url}' after {max_trials} trials.")

    print(f"Url '{url}' is reachable.")
    

if __name__ == "__main__":
    run()
        