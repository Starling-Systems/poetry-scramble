import requests
import string
import random

def get_random_sonnet_json():
    sonnets_response = requests.get("https://ajpj.fact50.net/PoetryScramble/ShakespeareSonnets.json")
    sonnets_response.raise_for_status()
    sonnets = sonnets_response.json()
    sonnet = random.choice(sonnets)[0]
    return sonnet

def get_last_word(l: str) -> list :
    """returns deworded string and the missing word"""
    words = l.split(" ")
    lastword = words[-1]
    if lastword[-1] in string.punctuation:
        lastpunct = lastword[-1]
        lastword = lastword[:-1]
    else:
        lastpunct = ""
    retwords = words[:-1]
    retwords.append("___" + lastpunct)
    return [" ".join(retwords), lastword]