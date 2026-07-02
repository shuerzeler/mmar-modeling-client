import { EventAggregator } from "aurelia";
 
/**
 * Dialog for running Process Mining algorithms via the mmar-pm-service.
 */
export class DialogProcessMining {
 
    algorithmChoice: string = "inductive";
    isCsv: boolean = false;
    caseId: string = "case:concept:name";
    activityName: string = "concept:name";
    timestamp: string = "time:timestamp";
    statusMessage: string = "";
    statusColor: string = "black";
 
    private selectedFile: File | null = null;
 
    constructor(
        private eventAggregator: EventAggregator,
    ) { }
 
    attached() {
        this.eventAggregator.subscribe("openProcessMiningDialog", async () => {
            // Reset state each time the dialog opens
            this.statusMessage = "";
            this.selectedFile = null;
            this.isCsv = false;
        });
    }
 
    onFileChange(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.selectedFile = input.files[0];
            this.isCsv = this.selectedFile.name.toLowerCase().endsWith(".csv");
        }
    }
 
    async runProcessMining() {
        if (!this.selectedFile) {
            this.statusMessage = "Please select a file first.";
            this.statusColor = "red";
            return;
        }
        if (!this.algorithmChoice) {
            this.statusMessage = "Please select an algorithm.";
            this.statusColor = "red";
            return;
        }
 
        this.statusMessage = "Running...";
        this.statusColor = "black";
 
        try {
            const formData = new FormData();
            formData.append("file", this.selectedFile);
 
            // Append CSV column mapping if needed
            if (this.isCsv) {
                formData.append("case_id", this.caseId);
                formData.append("activity_name", this.activityName);
                formData.append("timestamp", this.timestamp);
            }
 
            const response = await fetch(
                `http://localhost:8001/run?algorithm=${this.algorithmChoice}`,
                {
                    method: "POST",
                    body: formData,
                }
            );
 
            if (!response.ok) {
                const err = await response.text();
                this.statusMessage = `Error: ${err}`;
                this.statusColor = "red";
                return;
            }
 
            this.statusMessage = "Success! Model saved. Reload the scene list to see it.";
            this.statusColor = "green";
 
            // Notify the rest of the app to refresh the scene list
            this.eventAggregator.publish("processMiningCompleted", {});
 
        } catch (e: any) {
            this.statusMessage = `Request failed: ${e.message}`;
            this.statusColor = "red";
        }
    }
}