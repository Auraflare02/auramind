$audioDir = "C:\Users\RIDHAM\Downloads\auramind\auramind\public\videos\assets\audio"

Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoice("Microsoft David Desktop")
$synth.Rate = 3

$lines = @(
    @{ Name = "voice_scene1.wav"; Text = "Why do 92% of goals fail by day 4? Because traditional apps assume you're a robot." },
    @{ Name = "voice_scene2.wav"; Text = "Meet AuraMind. Don't plan a perfect day. Build a system that learns your real one." },
    @{ Name = "voice_scene3.wav"; Text = "In 60 seconds, get a 30-day adaptive timetable that flexes when life happens." },
    @{ Name = "voice_scene4.wav"; Text = "Hourly check-ins on WhatsApp, plus an AI calling agent in Hindi and English." },
    @{ Name = "voice_scene5.wav"; Text = "Focus timer sprints, level up your XP, and stay accountable with your friends." },
    @{ Name = "voice_scene6.wav"; Text = "Stop putting ambitions on hold. Visit the auramind link in bio and start Day 1 today!" }
)

foreach ($item in $lines) {
    $outPath = Join-Path $audioDir $item.Name
    $synth.SetOutputToWaveFile($outPath)
    $synth.Speak($item.Text)
}

$synth.Dispose()
